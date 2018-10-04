export interface IGoogleAuth{
    clientID: string
    clientSecret?: string
}

function getClientID(){
    const clientId = process.env.GOOGLE_CLIENT_ID

    if(!clientId){
        throw Error(`Set GOOGLE_CLIENT_ID in environment`)
    }

    return clientId
}


export const googleAuthConfig: IGoogleAuth = {
    clientID: getClientID(),
}