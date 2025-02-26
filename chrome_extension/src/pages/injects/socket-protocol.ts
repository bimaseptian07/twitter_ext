
export interface GetterItem {
    kind: "value" | "common_getter"
    value: string
}

export type RootEvent = {

    keyword_event: {
        data: string[]
    }

    keyboard_event: {
        text: string
        args?: string[]
        keytap: boolean
    }
    
	status_pool: {
        connected_worker: number
        ready_worker: number
    }
    join: {
        view_session_id: string
    }
    unjoin: {}
    fetch_custom: {
        callback_id: string
        url: string
        method: string
        body: string
        headers: {
            [k in string]: GetterItem
        }
        credentials?: "include"
        anticrawler?: {
            appKey: string
        }
    },
    fetch: {
        callback_id: string
        url: string
    }
    fetch_callback: {
        callback_id: string
        data: string
    }
    
    eval_script: {
        script: string
    }
    eval_msg: {
        exec: string
    }
    log: {
        msg: string
    }
}

type MapperListener = {
    [key in keyof RootEvent]?: (data: RootEvent[key]) => void
}

export class SocketProtocol {
    ws: WebSocket
    maplistener: MapperListener

    constructor(ws: WebSocket) {
        this.ws = ws
        this.ws.onmessage = this.onmessage.bind(this)
        this.maplistener = {}
    }

    public onmessage(ev: MessageEvent<string>) {
        const datastr = ev.data
        const [event_type, obj] = this.deserialize(datastr)
        
        if(this.maplistener[event_type] === undefined) {
            this.send('log', {
                msg: "no listener " + JSON.stringify(obj)
            })
            return
        }

        const fn = this.maplistener[event_type]
        fn(obj)
    }

    public send<K extends keyof RootEvent>(tipe: K, data: RootEvent[K]) {
        const dataraw = this.eventSerialize(tipe, data)
        this.ws.send(dataraw)
    }

    public log(data: any) {
        console.log(data)
        this.send('log', {
            msg: JSON.stringify(data)
        })
    }

    public deserialize(data: string) {
        const eventlen = Number(data.slice(0, 3))
        const event_type = data.slice(3, 3 + eventlen)
        const msg = data.slice(3+eventlen)
        const obj = JSON.parse(msg)
        return [event_type, obj]
    }

    public listen<K extends keyof MapperListener>(tipe: K, fn: MapperListener[K]){
        this.maplistener[tipe] = fn
    }

    public eventSerialize<K extends keyof RootEvent>(tipe: K, data: RootEvent[K]): string{
        const eventLen = tipe.length
        const rawdata =JSON.stringify(data)
        const eventlenstr = pad(eventLen, 3)
        return eventlenstr + tipe + rawdata
    }
}

function pad(num, size): string {
    let s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}