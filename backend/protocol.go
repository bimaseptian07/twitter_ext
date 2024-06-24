package main

import (
	"encoding/json"
	"fmt"
	"log"
	"strconv"

	"github.com/gorilla/websocket"
)

type EventMsg interface {
	EventName() string
}

type PdcSocketProtocol struct {
	Con *websocket.Conn
}

func (proc *PdcSocketProtocol) Send(event EventMsg) error {
	rawmsg, err := proc.Serialize(event)
	if err != nil {
		return err
	}

	return proc.Con.WriteMessage(websocket.TextMessage, []byte(rawmsg))
}

func (proc *PdcSocketProtocol) Listen() {
	for {
		_, msg, err := proc.Con.ReadMessage()
		if err != nil {
			log.Println(err)
			break
		}

		eventtype, data, err := proc.Type(string(msg))
		if err != nil {
			log.Println("parsing error " + string(msg))
			continue
		}
		log.Println(eventtype, data)

		if eventtype == "" {
			log.Println("unknown event type")
		}

	}
}

func (proc *PdcSocketProtocol) Serialize(event EventMsg) (string, error) {
	data, err := json.Marshal(event)
	if err != nil {
		return "", err
	}
	eventname := event.EventName()
	hasil := fmt.Sprintf("%03d%s%s", len(eventname), eventname, data)
	return hasil, nil
}

func (proc *PdcSocketProtocol) Type(data string) (string, string, error) {
	lenstr := data[:3]
	si, err := strconv.Atoi(lenstr)
	if err != nil {
		return "", "", err
	}
	eventName := data[3 : 3+si]

	return eventName, data[3+si:], nil
}

type EvalMessage struct {
	Exec string `json:"exec"`
}

// EventName implements EventMsg.
func (e *EvalMessage) EventName() string {
	return "eval_msg"
}
