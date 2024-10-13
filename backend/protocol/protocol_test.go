package protocol_test

import (
	"backend/protocol"
	"testing"
)

func TestProtocol(t *testing.T) {
	proc := protocol.PdcSocketProtocol{}

	data, _ := proc.Serialize(&protocol.EvalMessage{
		Script: "alert('kampret was here')",
	})

	t.Error(proc.Type(data))
}
