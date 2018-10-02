import * as jwt from 'express-jwt'

import { JWT_SECRET } from '../config/jwt'

export function getJWTMiddleware(exclude: string[]){
    let secret = JWT_SECRET
    return jwt({secret}).unless({
        path: exclude
    })
}