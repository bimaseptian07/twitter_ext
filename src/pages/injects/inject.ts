import { render } from "solid-js/web"
import { v4 as uuidv4 } from 'uuid'
import AppInjectFrontend, { setWorkState } from './InjectComponent'
import { eventSerialize } from './socket-protocol'

function createWebsocket(): Promise<WebSocket> {
    const prom = new Promise<WebSocket>((resolve, reject) => {
        const ws = new WebSocket('ws://localhost:8080/ws')

        ws.onopen = () => {
            resolve(ws)

            ws.onmessage = (ev: MessageEvent<any>): any => {
                const datastr = ev.data
                eval(datastr)
                ws.send("evaling " +datastr)
            }
        }
    })
    
    return prom
}




function injectFrontend() {
    const tailwind = document.createElement("script")
    tailwind.src = "https://cdn.tailwindcss.com"
    document.head.insertBefore(tailwind, document.head.firstChild)

    const inject = document.createElement("div")
    document.body.insertBefore(inject, document.body.firstChild)
    render(AppInjectFrontend, inject)
    
}


function injectXhr(){
    console.log("injecting xhr")

    const wd: any = window as any

    let sendData = function(data){
        console.log(data)
    }
    wd.sendData = sendData

    createWebsocket().then(ws => {
        sendData = function(data){
            ws.send(JSON.stringify(data))
            console.log(data)
        }
        wd.sendData = sendData
        injectFrontend()

        ws.send(eventSerialize('eval_msg', {
            exec: "ping"
        }))

    })

    window.fetch = new Proxy(window.fetch, {
        apply: function (target, that, args) {

            const url = args[0] as string

            

          // args holds argument of fetch function
          // Do whatever you want with fetch request
          let temp = target.apply(that, args);
          temp.then((res: Response) => {
            

            if(url.includes("v4/search/search_items")){

                const query: any = parseQuery(res.url)
                setWorkState("view_session_id", query.view_session_id ? query.view_session_id:"")

                sendData(res.url)
                const cept = res.clone()
                cept.json().then(data => {
                    
                    if(data.items) {
                        sendData({
                            count: data.items.length
                        })
                    } else {
                        sendData(data)
                    }
                    
                })
            }
          });
          return temp;
        },
      }); 

    }


function testRequest(){

    if(document.URL.includes("shopee")) {
        
        setInterval(() => {
            const myuuid = uuidv4()

            window.fetch("https://shopee.co.id/api/v4/search/search_items?by=relevancy&keyword=gamis%20pria%20jumbo&limit=60&newest=0&order=desc&page_type=search&scenario=PAGE_GLOBAL_SEARCH&version=2&view_session_id=" + myuuid).then(res => {
                console.log("from test")
            })
        }, 1000)
    }
    
    


}

injectXhr()
// testRequest()


function parseQuery(queryString) {
    var query = {};
    var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    return query;
}