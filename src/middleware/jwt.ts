import * as jwt from 'express-jwt'

export function JWTMiddleware(secret: string, exclude: string[]){
    return jwt({secret}).unless({
        path: exclude
    })
}