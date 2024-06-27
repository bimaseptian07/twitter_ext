import { render } from "solid-js/web"
import { v4 as uuidv4 } from 'uuid'
import AppInjectFrontend, { setWorkState } from './InjectComponent'
import { SocketProtocol } from './socket-protocol'
import { setSocketStatus, socketData } from './state'

var wsGlobalProto = new Promise<SocketProtocol>((resolve, reject) => {
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
    }

})

function Connection(handle: (proc: SocketProtocol) => void) {
    wsGlobalProto.then(handle)
}

// function createWebsocket(): Promise<SocketProtocol> {
//     const prom = new Promise<SocketProtocol>((resolve, reject) => {
//         const ws = new WebSocket('ws://localhost:8080/ws')
//         const proc = new SocketProtocol(ws)
//         const wd: any = window as any
//         wd.wsprotocol = proc

//         ws.onopen = () => {
//             resolve(proc)
            
//         }
//     })
    
//     return prom
// }




function injectFrontend() {
    const tailwind = document.createElement("script")
    tailwind.src = "https://cdn.tailwindcss.com"
    document.head.insertBefore(tailwind, document.head.firstChild)

    const inject = document.createElement("div")
    document.body.insertBefore(inject, document.body.firstChild)
    render(AppInjectFrontend, inject)

    
}


function injectXhr(){
    if(!document.URL.includes("shopee")) {
        console.log("bukan page shopee")
        return
    }
    console.log("injecting xhr")
    document
            .addEventListener("DOMContentLoaded",
                function () {
                    injectFrontend()
                }
            );
    // Connection(() => {
    //     injectFrontend()
    // })

    
    

    window.fetch = new Proxy(window.fetch, {
        apply: function (target, that, args) {

            const url = args[0] as string

            

          // args holds argument of fetch function
          // Do whatever you want with fetch request
          let temp = target.apply(that, args);
          temp.then((res: Response) => {
            
            Connection(proc => {
                proc.listen('fetch', event => {
                    window.fetch(event.url).then(res => {
                        res.text().then(datatext => {
                            proc.send("fetch_callback", {
                                callback_id: event.callback_id,
                                data: datatext,
                            })
                        }).catch(reason => {
                            proc.send("fetch_callback", {
                                callback_id: event.callback_id,
                                data: reason,
                            })
                        })
                    }).catch(reason => {
                        proc.send("fetch_callback", {
                            callback_id: event.callback_id,
                            data: reason,
                        })
                    })
                })


                if(url.includes("v4/search/search_items")){

                    const query: any = parseQuery(res.url)
                    
                    setWorkState("view_session_id", (sid) => {
                        if(sid === ""){
                            if(query.view_session_id) {
                                proc.send("join", {
                                    view_session_id: query.view_session_id
                                })
                            }
                        }
                        setSocketStatus("joined", true)
                        return query.view_session_id ? query.view_session_id:""
                    })
                    

                    // const cept = res.clone()
                    // cept.json().then(data => {
                        
                    //     if(data.items) {
                    //         proc.send("log", {
                    //             msg: JSON.stringify({
                    //                 count: data.items.length
                    //             })
                    //         })
                    //         proc.send('log', {
                    //             msg: res.url
                    //         })
                    //     } else {
                    //         proc.send("log", {
                    //             msg: JSON.stringify(data)
                    //         })
                    //     }
                        
                    // })
                }
            })

            
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