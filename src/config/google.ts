export interface IGoogleAuth{
    clientID: string
    clientSecret: string
    callbackURL: string
}


export const googleAuthConfig: IGoogleAuth = {
    clientID: 'client-id',
    clientSecret: 'client-secret',
    callbackURL: 'http://localhost:4000/auth/google/callback'
}