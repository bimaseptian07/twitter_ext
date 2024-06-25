package main

import (
	"errors"
	"log"
	"sync"
	"time"
)

type WsPool struct {
	count     int
	lastState int
	lock      sync.Mutex
	Data      map[string]*PdcSocketProtocol
	IndexIDs  []string
}

func NewWsPool() *WsPool {
	return &WsPool{
		count:     0,
		lastState: 0,
		Data:      map[string]*PdcSocketProtocol{},
		IndexIDs:  []string{},
	}
}

func (pool *WsPool) RandomRoute(
	handler func(ws *PdcSocketProtocol),
) error {
	pool.lock.Lock()
	defer pool.lock.Unlock()

	if pool.count == 0 {
		return errors.New("no anyone connected")
	}

	step := 0
	for {
		if step >= pool.count {
			return errors.New("no anyone can handle request")
		}
		pool.lastState += 1
		if pool.lastState >= pool.count {
			pool.lastState = 0
		}

		id := pool.IndexIDs[pool.lastState]
		ws := pool.Data[id]

		if ws.CanCall(time.Second * 3) {
			go handler(ws)
			return nil
		}
		log.Println(step)
		step += 1
	}

}

func (pool *WsPool) Add(ws *PdcSocketProtocol) {
	pool.lock.Lock()
	defer pool.lock.Unlock()
	pool.Data[ws.ID] = ws
	pool.IndexIDs = append(pool.IndexIDs, ws.ID)
	pool.count += 1
}

func (pool *WsPool) Remove(ID string) {
	pool.lock.Lock()
	defer pool.lock.Unlock()
	delete(pool.Data, ID)

	ids := []string{}
	for _, id := range pool.IndexIDs {
		if ID == id {
			continue
		}

		ids = append(ids, id)
	}
	pool.IndexIDs = ids
	pool.count -= 1
	if pool.lastState >= pool.count {
		pool.lastState = 0
	}
}
