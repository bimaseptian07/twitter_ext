package main

import (
	"backend"
	"backend/protocol"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/go-vgo/robotgo"
	"github.com/gorilla/websocket"
	"github.com/pdcgo/v2_gots_sdk"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

func main() {
	router := gin.Default()
	router.Use(CorsMiddleware)

	upgrader.CheckOrigin = func(r *http.Request) bool {
		return true
	}

	pool := protocol.NewWsPool()

	router.GET("/v2/ipc", func(c *gin.Context) {

		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			return
		}
		defer conn.Close()

		proc := protocol.NewPdcSocketProtocol(conn)
		pool.Add(proc)
		defer pool.Remove(proc.ID)

		proc.Register(
			&GetKeywordEvent{},
			&protocol.EventLog{},
			&protocol.JoinEvent{
				Pool: pool,
			},
			&KeyboardEvent{},
		)

		proc.Listen()

		fmt.Printf("closing connection for %s\n", proc.ID)
	})

	sdkrouter := v2_gots_sdk.NewApiSdk(router)

	var err error
	var save func() = func() {}

	if os.Getenv("DEV_MODE") != "" {
		save, err = sdkrouter.GenerateSdkFunc("../chrome_extension/src/helpers/sdk.ts", "./sdk.ts.template")
		if err != nil {
			panic(err)
		}
	}

	api := sdkrouter.Group("v1")
	backend.RegisterApi(api)

	save()

	listen := "localhost:8008"
	router.Run(listen)
}

func CorsMiddleware(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.Header("Access-Control-Allow-Credentials", "true")
	ctx.Header("Access-Control-Allow-Headers", "Connection, Content-Type, Content-Length, Accept-Language, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
	ctx.Header("Access-Control-Allow-Methods", "HEAD,PATCH,OPTIONS,GET,POST,PUT,DELETE")

	if ctx.Request.Method == "OPTIONS" {
		ctx.AbortWithStatus(204)
		return
	}

	ctx.Next()
}

type GetKeywordEvent struct {
	Data []string `json:"data"`
}

// CreateEmpty implements protocol.EventMsg.
func (g *GetKeywordEvent) CreateEmpty() (protocol.EventMsg, error) {
	return &GetKeywordEvent{}, nil
}

// EventName implements protocol.EventMsg.
func (g *GetKeywordEvent) EventName() string {
	return "keyword_event"
}

// Exec implements protocol.EventMsg.
func (g *GetKeywordEvent) Exec(proc *protocol.PdcSocketProtocol) error {
	data, _ := os.ReadFile("./keyword.txt")
	datas := strings.Split(string(data), ",")
	hasil := make([]string, len(datas))

	for i, item := range datas {
		hasil[i] = strings.TrimSpace(item)
	}

	g.Data = hasil

	return proc.Send(g)
}

type KeyboardEvent struct {
	Text   string   `json:"text"`
	Args   []string `json:"args"`
	Keytap bool     `json:"keytap"`
}

// CreateEmpty implements protocol.EventMsg.
func (k *KeyboardEvent) CreateEmpty() (protocol.EventMsg, error) {
	return &KeyboardEvent{}, nil
}

// EventName implements protocol.EventMsg.
func (k *KeyboardEvent) EventName() string {
	return "keyboard_event"
}

// Exec implements protocol.EventMsg.
func (k *KeyboardEvent) Exec(proc *protocol.PdcSocketProtocol) error {
	if k.Keytap {
		robotgo.KeyTap(k.Text, k.Args)
		return nil
	}
	robotgo.TypeStr(k.Text)

	return nil
}
