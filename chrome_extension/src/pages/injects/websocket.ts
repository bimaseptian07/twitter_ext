import { SocketProtocol } from './socket-protocol'
import { setSessionState, setSocketStatus, socketData } from './state'


export var wsGlobalProto = new Promise<SocketProtocol>((resolve, reject) => {
    if(socketData.socket_uri == "") {
        console.log("socket uri not initiated")
        return
    }
    
    const ws = new WebSocket(socketData.socket_uri)
    const proc = new SocketProtocol(ws)
    ws.onopen = () => {
        setSocketStatus('connected', true)
        resolve(proc)
    }
    ws.onclose = () => {
        setSocketStatus("connected", false)
        setSocketStatus("joined", false)
        setSessionState("view_session_id", "")
        
    }
    

})

export function Connection(handle: (proc: SocketProtocol) => void) {
    wsGlobalProto.then(handle)
}
