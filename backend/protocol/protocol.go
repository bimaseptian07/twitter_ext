package protocol

import (
	"encoding/json"
	"fmt"
	"log"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type EventMsg interface {
	EventName() string
	Exec(proc *PdcSocketProtocol) error
	CreateEmpty() (EventMsg, error)
}

type PdcSocketProtocol struct {
	ID            string
	ViewSessionID string
	Con           *websocket.Conn
	eventMap      map[string]EventMsg
	ErrChan       chan error

	lastRemote time.Time
	wlock      sync.Mutex
}

func NewPdcSocketProtocol(conn *websocket.Conn) *PdcSocketProtocol {
	id := uuid.New()
	ids := strings.Split(id.String(), "-")
	fixid := ids[4]
	fixid = fixid[len(fixid)-5:]
	return &PdcSocketProtocol{
		ID:  fixid,
		Con: conn,

		lastRemote: time.Now().Add(time.Second * -5),
		eventMap:   map[string]EventMsg{},
		ErrChan:    make(chan error, 1),
	}
}

func (proc *PdcSocketProtocol) CanCall(rt time.Duration) bool {
	if proc.ViewSessionID == "" {
		return false
	}
	dur := time.Since(proc.lastRemote)
	return dur > rt
}

func (proc *PdcSocketProtocol) Send(event EventMsg) error {
	rawmsg, err := proc.Serialize(event)
	if err != nil {
		return err
	}

	proc.wlock.Lock()
	defer proc.wlock.Unlock()

	proc.lastRemote = time.Now()
	return proc.Con.WriteMessage(websocket.TextMessage, []byte(rawmsg))
}

func (proc *PdcSocketProtocol) Register(events ...EventMsg) {
	for _, item := range events {
		event := item
		proc.eventMap[item.EventName()] = event
	}
}

func (proc *PdcSocketProtocol) sendErr(err error) {
	if err != nil {
		proc.ErrChan <- err
	}
}

func (proc *PdcSocketProtocol) Listen() {
	go proc.ListeningMessage()
	for err := range proc.ErrChan {
		log.Println(err)
	}
}

func (proc *PdcSocketProtocol) ListeningMessage() {
	for {
		_, msg, err := proc.Con.ReadMessage()
		if err != nil {
			log.Println("error message", err)
			close(proc.ErrChan)
			break
		}

		eventtype, data, err := proc.Type(string(msg))
		if err != nil {
			log.Println("parsing error " + string(msg))
			log.Println(err)
			continue
		}

		eventTemplate := proc.eventMap[eventtype]
		if eventTemplate == nil {
			log.Println(eventtype + " not have handler " + data)
			continue
		}

		event, err := eventTemplate.CreateEmpty()
		if err != nil {
			proc.sendErr(err)
			continue
		}

		err = json.Unmarshal([]byte(data), event)
		if err != nil {
			proc.sendErr(err)
			continue
		}

		err = event.Exec(proc)
		if err != nil {
			proc.sendErr(err)
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
