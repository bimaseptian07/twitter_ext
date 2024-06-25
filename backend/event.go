package main

import (
	"fmt"
	"strings"

	"github.com/google/uuid"
)

type JoinEvent struct {
	ViewSessionID string `json:"view_session_id"`
}

// CreateEmpty implements EventMsg.
func (j *JoinEvent) CreateEmpty() (EventMsg, error) {
	return &JoinEvent{}, nil
}

// EventName implements EventMsg.
func (j *JoinEvent) EventName() string {
	return "join"
}

// Exec implements EventMsg.
func (j *JoinEvent) Exec(proc *PdcSocketProtocol) error {
	proc.ViewSessionID = j.ViewSessionID
	fmt.Printf("new worker joining on server %s \n", proc.ID)

	// log.Println("user joined", j.ViewSessionID)
	// uri := `https://shopee.co.id/api/v4/search/search_items?by=relevancy&extra_params={"global_search_session_id":"gs-817cad85-7860-4cb6-b9a6-3bda7f80a891","search_session_id":"ss-c3137007-028a-41a2-b037-077b6bf2bd06"}&keyword=asdasd&limit=60&newest=0&order=desc&page_type=search&scenario=PAGE_GLOBAL_SEARCH&version=2&view_session_id=` + j.ViewSessionID

	// limit := 1000

	// c := 0
	// for {
	// 	if c > limit {
	// 		break
	// 	}

	// 	err := proc.Send(&FetchEvent{
	// 		Url: uri,
	// 	})
	// 	log.Println(err)

	// 	time.Sleep(time.Second * 3)
	// 	c += 1
	// }

	return nil
}

type FetchEvent struct {
	CallbackID string `json:"callback_id"`
	RouteID    string `json:"route_id"`
	Url        string `json:"url"`
}

// CreateEmpty implements EventMsg.
func (f *FetchEvent) CreateEmpty() (EventMsg, error) {
	return &FetchEvent{}, nil
}

// EventName implements EventMsg.
func (f *FetchEvent) EventName() string {
	return "fetch"
}

// Exec implements EventMsg.
func (f *FetchEvent) Exec(proc *PdcSocketProtocol) error {
	return nil
}

type FetchCallbackEvent struct {
	CallbackID     string `json:"callback_id"`
	Data           string `json:"data"`
	mapperCallback map[string]chan string
}

// CreateEmpty implements EventMsg.
func (f *FetchCallbackEvent) CreateEmpty() (EventMsg, error) {
	return &FetchCallbackEvent{
		mapperCallback: f.mapperCallback,
	}, nil
}

// EventName implements EventMsg.
func (f *FetchCallbackEvent) EventName() string {
	return "fetch_callback"
}

// Exec implements EventMsg.
func (f *FetchCallbackEvent) Exec(proc *PdcSocketProtocol) error {
	f.mapperCallback[f.CallbackID] <- f.Data
	return nil
}

type EvalMessage struct {
	Script string `json:"script"`
}

// CreateEmpty implements EventMsg.
func (e *EvalMessage) CreateEmpty() (EventMsg, error) {
	return &EvalMessage{}, nil
}

// EventName implements EventMsg.
func (e *EvalMessage) EventName() string {
	return "eval_msg"
}

// Exec implements EventMsg.
func (e *EvalMessage) Exec(proc *PdcSocketProtocol) error {
	return nil
}

func GenCallbackID() string {
	id := uuid.New()
	ids := strings.Split(id.String(), "-")
	fixid := ids[4]

	return fixid
}
