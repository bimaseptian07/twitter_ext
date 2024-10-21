// import { KeywordRes, useQuery } from "@src/helpers/sdk"
import { createEffect, createSignal, Show } from "solid-js"
import { SocketProtocol } from "./socket-protocol"
import { Connection } from "./websocket"
import { Subject } from "rxjs"
import { createReplyFormat } from "./replyformat"
import { createLocalStore } from "@src/helpers/localstorage"
// import { clearInterval } from "timers"
// import { createEffect } from "solid-js"



class ExplorePage {
    write(elem: HTMLElement, textd: string) {
        for(const c of textd) {
            let ctrlCEvent = new KeyboardEvent('keydown', {
                key: c
            })
              
            elem.dispatchEvent(ctrlCEvent)
        }
        
    }
    public findByXpath<T extends HTMLElement>(path: string){
        const prom = new Promise<T>((resolve, reject)=> {
            let inter: NodeJS.Timer = null
            setTimeout(() => {
                if(inter != null) {
                    clearInterval(inter)
                }
                reject("element not found")
            }, 10000)
            
            inter = setInterval(() => {
                const res = document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
                if(res.singleNodeValue != null){
                    clearInterval(inter)
                    resolve(res.singleNodeValue as any)
                }
            }, 500)
        })
        return prom
    }
    public async search(keyword: string){
        const searchNode = await this.findByXpath<HTMLInputElement>('//*/input[@data-testid="SearchBox_Search_Input"]')
        searchNode.focus()
        searchNode.select()

        const prom = new Promise((resolve, reject) => {
            Connection(async (proc: SocketProtocol) => {
                
                proc.send("keyboard_event", {
                    text: keyword,
                    keytap: false
                })

                proc.send("keyboard_event", {
                    text: "enter",
                    keytap: true
                })
                

                const comment = await this.findByXpath('//*/button[@data-testid="reply"]')
                comment.click()
                await delay(2000)
                const rep = createReplyFormat("https://lapakaman.com/N6RBnEdhe")
                proc.send("keyboard_event", {
                    text: rep,
                    keytap: false
                })

                await delay(4000)
                const reply = await this.findByXpath('//*/button[@data-testid="tweetButton"]')
                reply.click()
                await delay(1000)

                resolve(true)
            })
            
        })
        return await prom
    }

    public getElementByXpath(path) {
        return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    }
}

type RandomActivityItem = "follow" | "search_comment" | ""

// const randomActivity = new Subject<RandomActivityItem>()

export default function AppInjectFrontend() {
    const [keyword, setKeyword] = createSignal<string[]>([])
    const [action, setAction] = createSignal<RandomActivityItem>("")
    const [isRun, setRun] = createLocalStore<{running: boolean}>({running: false})

    const explore = new ExplorePage();
    (document as any).page = explore;

    const startRandom = async () => {
        const datas: RandomActivityItem[] = ["follow", "follow", "search_comment"]

        while(true){
            if(!isRun.running){
                await delay(1000)
                continue
            }
            const item = datas[Math.floor((Math.random()*datas.length))];
            setAction(item)
            
            switch(item) {
                case "search_comment":
                    try{
                        await searchComment()
                    } catch (e) {
                        console.log(e)
                        window.open("https://x.com/explore","_self")
                    }
                    
                    break
                case "follow":

                    try {
                        const followbtn = await explore.findByXpath(`//*/button[contains(@data-testid, '-follow')]`)
                        followbtn.click()
                        await delay(2000)
                    } catch(e) {
                        console.log(e)
                    }
                    
                    
                    break

            }
            
        }    
    }


    const searchComment = async () => {
        const items = keyword()
        const item = items[Math.floor((Math.random()*items.length))]

        try {
            await explore.search(item)
        } catch(e) {
            console.error(e, "reloading page")
            window.location.reload()
        }
    }

    createEffect(() => {
        Connection((proc: SocketProtocol)  => {
            proc.listen("keyword_event", (data) => {
                setKeyword(data.data)
            })

            proc.send("keyword_event", {data:[]})
            startRandom()
        });
    })

    return <div>
        <Show
            when={isRun.running}
            fallback={<button onClick={()=> setRun({running: true})}>Start</button>}
        >
            <button onClick={()=> setRun({running: false})}>Stop</button>
        </Show>

        
        <div>len keyword {keyword().length}</div>
        <div>current action {action()}</div>
        

    </div>
}



function delay(t: number) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, t)
    })
}