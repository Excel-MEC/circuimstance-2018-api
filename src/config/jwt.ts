import * as jwt from 'jsonwebtoken'

function getJWTSecret(): string{
    let jwtsecret = process.env.JWT_SECRET
    if(!jwtsecret){
        throw Error(`Set JWT_SECRET environment variable`)
    }

    return jwtsecret
}


function getJWTExpireTime(): string{
    let jwtexpiry = process.env.JWT_EXPIRY
    if(!jwtexpiry){
        throw Error(`Set JWT_EXPIRY environment variable`)
    }

    return jwtexpiry
}

export const JWT_SECRET = getJWTSecret()
export const JWT_EXPIRY = getJWTExpireTime()
export const sign = (userId: string,admin: boolean) :string => {
    return jwt.sign({
        id: userId,
        admin
    }, JWT_SECRET, {
        algorithm: 'HS256',
        expiresIn: JWT_EXPIRY
    })
}