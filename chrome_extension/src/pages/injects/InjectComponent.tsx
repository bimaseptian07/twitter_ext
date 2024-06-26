
import { Show, createEffect, createSignal, onCleanup } from 'solid-js';
import { createStore } from "solid-js/store";
import { setSocketData, socketData, socketStatus } from './state';

interface WorkerState {
    joined: boolean
    view_session_id: string

}
export const [workerState, setWorkState] = createStore<WorkerState>({
    joined: false,
    view_session_id: ""
})

export interface PoolStatus {
    connected_worker: number
    ready_worker: number
}

function ServerStatus() {
    const [status, setStatus] = createSignal<PoolStatus>({
        connected_worker: 0,
        ready_worker: 0
    })
    const getStatus = () => {
        const uri = new URL(socketData.socket_uri)
        uri.pathname = "/status"
        if(uri.protocol === "ws:") {
            uri.protocol = "http:"
        } else {
            uri.protocol = "https:"
        }
        fetch(uri.toString()).then(res => {
            res.json().then(data => {
                setStatus(data)
            })
        })
    }

    let interval = null

    createEffect(() => {
        interval = setInterval(getStatus, 10000)
    })
    onCleanup(() => {
        if(interval !== null) {
            clearInterval(interval)
        }
    })
    // fetch(socketData.socket_uri)
    return (
        <div class='p-3'>
            <b>{status().connected_worker}</b> Browser Connected <br />
            <b>{status().ready_worker}</b> Browser Ready Connected 
        </div>
    )
}

export default function AppInjectFrontend() {
    const [uri, setUri] = createSignal<string>(socketData.socket_uri)

    return <div class="grid grid-cols-2 h-28">
        <div class="p-2">
            <div class="flex w-full items-center gap-2">
                <input 
                    placeholder='Connect Server...'
                    value={socketData.socket_uri}
                    onChange={e => setUri(e.target.value)}
                    class='w-full px-2.5 py-1.5 outline-0 border border-stone-200 rounded placeholder:text-stone-400 focus:outline focus:outline-sky-400 focus:outline-4' />
                <div>
                    <button
                        onClick={() => {
                            setSocketData("socket_uri", uri())
                        }}
                        class="bg-sky-500 text-white px-2 py-1 rounded shadow capitalize"
                    >set</button>
                    
                </div>
                <Show when={socketStatus.connected}>
                    <span class='px-2.5 text-sm py-1 bg-emerald-500 text-white rounded shadow w-max h-min'>
                        <span>Connected</span>
                    </span>
                </Show>
                <Show when={socketStatus.joined}>
                    <span class='px-2.5 text-sm py-1 bg-emerald-500 text-white rounded shadow w-max h-min'>
                        <span>Joined</span>
                    </span>
                </Show>
            </div>
            <ServerStatus />

        </div>

        

        

        <div class="p-2">
        
            <b>Data Page :</b>
            <div class="grid grid-cols-2">
                <div>
                    view_session_id
                </div>
                <div>
                    : <b>{workerState.view_session_id}</b>
                </div>
            </div>

        </div>



    </div>
}