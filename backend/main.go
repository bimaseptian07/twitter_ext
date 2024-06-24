package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

func main() {
	upgrader.CheckOrigin = func(r *http.Request) bool {
		return true
	}

	router := gin.Default()
	router.Use(CorsMiddleware)
	router.GET("/ws", func(c *gin.Context) {
		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			return
		}
		defer conn.Close()

		go func() {
			// data := `
			// var url = "https://shopee.co.id/api/v4/search/search_items?by=relevancy&extra_params=%7B%22global_search_session_id%22%3A%22gs-e83e2c25-f514-4a75-8a4f-9484e71fb521%22%2C%22search_session_id%22%3A%22ss-5d732e0e-53f3-4dbd-b904-90dbc86c6efb%22%7D&keyword=asdvv&limit=60&newest=0&order=desc&page_type=search&scenario=PAGE_GLOBAL_SEARCH&version=2&view_session_id=afdb9b8a-4c35-4adf-bafc-bc5f466a4cf5"

			// window.fetch(url).then(res => {
			//     const cept = res.clone()
			//     cept.json().then(data => {

			//        window.sendData(data)

			//     })
			// })
			// `
			data := `console.log("kampret was here")`
			conn.WriteMessage(websocket.TextMessage, []byte(data))
		}()

		proc := PdcSocketProtocol{
			Con: conn,
		}

		proc.Listen()
	})
	router.Run("localhost:8080")
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
