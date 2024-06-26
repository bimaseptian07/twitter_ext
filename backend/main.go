package main

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

type FetchPost struct {
	Uri string `json:"uri" binding:"required"`
}

func main() {

	pool := NewWsPool()
	callbackMapper := map[string]chan string{}

	upgrader.CheckOrigin = func(r *http.Request) bool {
		return true
	}

	router := gin.Default()
	router.Use(CorsMiddleware)

	// registering websocket connection
	router.GET("/ws", func(c *gin.Context) {
		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			return
		}
		defer conn.Close()

		proc := NewPdcSocketProtocol(conn)
		pool.Add(proc)
		defer pool.Remove(proc.ID)

		proc.Register(
			&JoinEvent{},
			&FetchCallbackEvent{
				mapperCallback: callbackMapper,
			},
		)
		proc.Listen()
		fmt.Printf("closing connection for %s\n", proc.ID)
	})

	router.GET("status", func(ctx *gin.Context) {
		hasil, err := pool.GetPoolStatus()
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"message": err.Error(),
			})
			return
		}

		ctx.JSON(http.StatusOK, hasil)

	})

	router.POST("fetch", func(ctx *gin.Context) {
		callbackID := GenCallbackID()

		payload := FetchPost{}

		err := ctx.BindJSON(&payload)
		if err != nil {
			ctx.AbortWithStatusJSON(http.StatusBadRequest, gin.H{
				"message": "data payload tidak lengkap " + err.Error(),
				"err":     err.Error(),
			})
			return
		}
		uri, err := url.Parse(payload.Uri)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"message": "url tidak bisa diparsing",
			})
			return
		}

		timeoutctx, cancel := context.WithTimeout(context.TODO(), time.Second*10)
		defer cancel()

		err = pool.RandomRoute(func(ws *PdcSocketProtocol) {
			values := uri.Query()
			values.Add("view_session_id", ws.ViewSessionID)
			uri.RawQuery = values.Encode()

			ruri := uri.String()
			ws.Send(&FetchEvent{
				CallbackID: callbackID,
				RouteID:    ws.ID,
				Url:        ruri,
			})
		})

		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{
				"message": err.Error(),
			})
			return
		}
		reschan := make(chan string, 1)
		callbackMapper[callbackID] = reschan
		defer func() {
			delete(callbackMapper, callbackID)
		}()
		defer close(reschan)

		select {
		case <-timeoutctx.Done():
			ctx.JSON(http.StatusInternalServerError, gin.H{
				"message": "data not fetched",
			})
		case data := <-reschan:
			ctx.JSON(http.StatusOK, gin.H{
				"message": "success",
				"data":    data,
			})
		}

	})

	certfile := os.Getenv("CERT_FILE")
	keyfile := os.Getenv("KEY_FILE")
	if certfile != "" && keyfile != "" {
		router.RunTLS(":8080", certfile, keyfile)
	} else {
		router.Run("localhost:8080")
	}

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
