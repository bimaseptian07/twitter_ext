// import { KeywordRes, useQuery } from "@src/helpers/sdk"
import { createEffect } from "solid-js"
import { SocketProtocol } from "./socket-protocol"
import { Connection } from "./websocket"
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

                setTimeout(() => {
                    proc.send("keyboard_event", {
                        text: `see me profile for ${keyword} insight`,
                        keytap: false
                    })

                    setTimeout(async ()=> {
                        const reply = await this.findByXpath('//*/button[@data-testid="tweetButton"]')
                        reply.click()
                        setTimeout(() => {
                            resolve(true)
                        }, 4000)
                        
                    }, 4000)

                }, 4000)
            })
        })
        return await prom
    }

    public getElementByXpath(path) {
        return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    }
}





export default function AppInjectFrontend() {
    

    const startScript = ()=> {
        const explore = new ExplorePage();
        (document as any).page = explore;
        
        Connection((proc: SocketProtocol)  => {
            proc.listen("keyword_event", async (data) => {
                let items = data.data

                for(let c = 0;c<100;c++) {
                    const item = items[Math.floor((Math.random()*items.length))];

                    try {
                        await explore.search(item)
                    } catch(e) {
                        console.error(e, "reloading page")
                        window.location.reload()
                    }
                    
                }
                
            })

            proc.send("keyword_event", {data:[]})


        });
        
        // const explore = new ExplorePage();
        // (document as any).page = explore;
    
        // explore.search("shopee")
    }

    return <div>
        <button onClick={()=> startScript()}>Start</button>
    </div>
}