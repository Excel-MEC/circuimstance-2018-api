import * as jwt from 'express-jwt'
import * as jwksRsa from 'jwks-rsa'

// import { JWT_SECRET } from '../config/jwt'

export function getJWTMiddleware(exclude: string[]){
    let secret =jwksRsa.expressJwtSecret({
        cache:true,
        rateLimit:true,
        jwksRequestsPerMinute:10,
        jwksUri: 'https://nvnmo.auth0.com/.well-known/jwks.json'

    }) 
    return jwt({
        secret,
        audience: 'FHVUTB2fvLsBDM3nRk19fBVPA4GArhjj',
        issuer: 'https://nvnmo.auth0.com/',
        algorithms: ['RS256']
    }).unless({
        path: exclude
    })
}