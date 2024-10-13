import { render } from "solid-js/web"
import AppInjectFrontend from './InjectComponent'

function injectFrontend() {
    // const tailwind = document.createElement("script")
    // tailwind.src = "https://cdn.tailwindcss.com"
    // document.head.insertBefore(tailwind, document.head.firstChild)
    console.log("[kampretcode] frontend injecting")

    const inject = document.createElement("div")
    document.body.insertBefore(inject, document.body.firstChild)
    render(AppInjectFrontend, inject)

    console.log("[kampretcode] frontend injected")
}

function docReady(fn) {
    // see if DOM is already available
    if (document.readyState === "complete" || document.readyState === "interactive") {
        // call on next available tick
        setTimeout(fn, 1);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}    

function main(){

    docReady(() => {
        injectFrontend()
    })
            
    console.log("injecting to twitter")
}


main()