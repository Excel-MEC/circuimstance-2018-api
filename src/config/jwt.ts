import * as jwt from 'jsonwebtoken'
import * as expressjwt from 'express-jwt'

function getJWTSecret(): string{
    let jwtsecret = process.env.JWT_SECRET
    if(!jwtsecret){
        throw Error(`Set JWT_SECRET environment variable`)
    }

    return jwtsecret
}

export const JWT_SECRET = getJWTSecret()
export const sign = (userId: string,admin: boolean) :string => {
    return jwt.sign({
        id: userId,
        admin
    }, JWT_SECRET, {
        algorithm: 'HS256',
        expiresIn: '12h'
    })
}