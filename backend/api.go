package backend

import (
	"backend/apis"
	"net/http"

	"github.com/pdcgo/v2_gots_sdk"
	"github.com/pdcgo/v2_gots_sdk/pdc_api"
)

func RegisterApi(api *v2_gots_sdk.SdkGroup) {
	api.Register(&pdc_api.Api{
		Method:       http.MethodGet,
		RelativePath: "keyword",
		Response:     &apis.KeywordRes{},
	}, apis.GetKeywordFile)
}
