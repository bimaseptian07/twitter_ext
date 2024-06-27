import { makePersisted } from '@solid-primitives/storage'
import { createStore } from 'solid-js/store'


export interface SocketData {
    socket_uri: string
}

export const [socketData, setSocketData] = makePersisted(createStore<SocketData>({
    socket_uri: ""
}), {storage: localStorage})

export interface SocketStatus {
    connected: boolean
    joined: boolean
}

export const [socketStatus, setSocketStatus] = createStore<SocketStatus>({
    connected: false,
    joined: false
})

export interface WorkerState {
    view_session_id: string

}
export const [sessionState, setSessionState] = createStore<WorkerState>({
    view_session_id: ""
})