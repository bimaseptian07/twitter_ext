package protocol

import (
	"encoding/json"
	"log"
)

type EventLog struct {
	Msg string `json:"msg"`
}

// CreateEmpty implements EventMsg.
func (e *EventLog) CreateEmpty() (EventMsg, error) {
	return &EventLog{}, nil
}

// EventName implements EventMsg.
func (e *EventLog) EventName() string {
	return "log"
}

// Exec implements EventMsg.
func (e *EventLog) Exec(proc *PdcSocketProtocol) error {
	data := map[string]interface{}{}

	err := json.Unmarshal([]byte(e.Msg), &data)
	if err != nil {
		return err
	}

	rawdata, err := json.MarshalIndent(data, "", "   ")
	log.Println("[log browser] ", string(rawdata))
	return err
}
