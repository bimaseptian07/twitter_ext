package main

type CallbackMapper struct {
	Data map[string]chan string
}
type CallbackPool struct {
	// lock   sync.RWMutex
}

// func (pool *CallbackPool)
