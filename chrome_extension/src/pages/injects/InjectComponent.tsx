
import { Show } from 'solid-js';
import { createStore } from "solid-js/store";

interface WorkerState {
    joined: boolean
    view_session_id: string

}
export const [workerState, setWorkState] = createStore<WorkerState>({
    joined: false,
    view_session_id: ""
}) 

export default function AppInjectFrontend() {
    return <div class="grid grid-cols-2 h-28">
        <div>
            [ {workerState.joined ? "joined": "not joined"} ] connected to websocket kampret <br />
            <Show
                when={!workerState.joined}
            >
                <button
                    onClick={() =>setWorkState("joined", true)}
                >join</button>
            </Show>
        </div>

        <div>
            <h1>Data Page :</h1>
            <div class="grid grid-cols-2">
                <div>
                view_session_id
                </div>
                <div>
                : {workerState.view_session_id}
                </div>
            </div>
            
        </div>
        
        

    </div>
}