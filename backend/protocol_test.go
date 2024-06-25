package main

import "testing"

func TestProtocol(t *testing.T) {
	proc := PdcSocketProtocol{}

	data, _ := proc.Serialize(&EvalMessage{
		Script: "alert('kampret was here')",
	})

	t.Error(proc.Type(data))
}
