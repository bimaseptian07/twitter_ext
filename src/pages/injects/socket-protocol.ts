

export type RootEvent = {
    eval_msg: {
        exec: string
    }
}


export function eventDeserialize() {

} 

export function eventSerialize<K extends keyof RootEvent>(tipe: K, data: RootEvent[K]): string{
    const eventLen = tipe.length
    const rawdata =JSON.stringify(data)
    const eventlenstr = pad(eventLen, 3)
    return eventlenstr + tipe + rawdata
}

function pad(num, size): string {
    let s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}