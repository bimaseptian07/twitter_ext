export interface CommonGetterValue {
    web_unique_ccd: string
    make_id: string
    crsftoken: string
}

export interface CommonGetterItem {
    name: keyof CommonGetterValue
}

export type CommonGetterFunc = {
    [k in keyof CommonGetterValue]: () => CommonGetterValue[k]
}

const commonGetter: CommonGetterFunc = {
    web_unique_ccd: getSzToken,
    make_id: () => makeID(17),
    crsftoken: () => getCookies(document.cookie)["csrftoken"]
}

export function GetCommon<K extends keyof CommonGetterValue>(key: K): CommonGetterValue[K] {
    if(commonGetter[key] === undefined){
        console.log(key + "not in common function getter shopee_connector")
        return ""
    }
    return commonGetter[key]()
}

export function getSzToken() {
    const cookies = getCookies(document.cookie)
    return cookies['shopee_webUnique_ccd']
}

export const getCookies = (cookieStr) =>
cookieStr.split(";")
    .map(str => str.trim().split(/=(.+)/))
    .reduce((acc, curr) => {
        acc[curr[0]] = curr[1];
        return acc;
    }, {})

// shopee_webUnique_ccd

export function makeID(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}


