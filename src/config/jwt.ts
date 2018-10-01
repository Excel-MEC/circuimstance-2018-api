import * as jwt from 'jsonwebtoken'

export const JWT_SECRET = process.env.JWT_SECRET
export const sign = (userId: string,admin: boolean) :string => {
    if(!JWT_SECRET){
        throw Error(`Set JWT_SECRET environment variable`)
    }

    return jwt.sign({
        id: userId,
        admin
    }, JWT_SECRET, {
        algorithm: 'HS256',
        expiresIn: '12h'
    })
}