package apis

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

type KeywordRes struct {
	Data []string `json:"data"`
}

func GetKeywordFile(ctx *gin.Context) {
	data, _ := os.ReadFile("./keyword.txt")
	datas := strings.Split(string(data), ",")
	hasil := make([]string, len(datas))

	for i, item := range datas {
		hasil[i] = strings.TrimSpace(item)
	}

	res := KeywordRes{
		Data: hasil,
	}

	ctx.JSON(http.StatusOK, res)
}
