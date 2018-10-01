import { Request, Response } from 'express'
import { User, IUserModel } from '../schemas/user';
import { OAuth2Client } from 'google-auth-library'
import { googleAuthConfig } from '../config/google'
import { TokenPayload } from 'google-auth-library/build/src/auth/loginticket';
import { sign } from '../config/jwt'
import { UserType } from '../interfaces/user';

interface IAuthResponse{
    name: string
    email: string
    imageURL?: string
}


class UserApi{

    constructor(){
        this.Authenticate = this.Authenticate.bind(this)
    }

    public getUserInfo(req: Request, res: Response): void{ //GET
        const userId: string = req.user.id
        User.findById(userId)
            .then( user => {
                if(!user){
                    res.sendStatus(400)
                }else{
                    res.json({
                        fullName: user.fullName,
                        email: user.email,
                        imageURL: user.imageURL,
                        score: user.score,
                        admin: user.type === UserType.admin,
                        roundCleared: user.roundCleared,
                        // TODO: add rank
                    })
                }
            }).catch( () => res.sendStatus(400))
    }

    public Authenticate(req: Request, res: Response): void{  // POST
        const IdToken: string = req.body.idToken

        const authResponse: IAuthResponse = {
            imageURL: req.body.imageURL,
            name: req.body.fullName,
            email: req.body.email
        }

        this.verifyIdToken(IdToken)
             .then(payload => {

                if(!payload){
                    res.sendStatus(401)
                }else{
                    let providerId = payload['sub']
                    User.findOne({providerId})
                        .then( user => {
                            if(!user){
                                const newUser: IUserModel = new User({
                                    email: authResponse.email,
                                    providerId,
                                    fullName: authResponse.name,
                                    imageURL: authResponse.imageURL
                                })

                                newUser.save((err,user) => {
                                    if(err){
                                        console.log(`Error upserting user: ${err}`)
                                        res.sendStatus(401)
                                    }else{
                                        res.json(this.createToken(user))
                                    }
                                })
                            }else{
                                res.json(this.createToken(user))
                            }
                        }).catch( () => res.sendStatus(401))
                }
             }).catch( () => res.sendStatus(401))

    }
    private client = new OAuth2Client(googleAuthConfig.clientID)

    private  verifyIdToken(idToken: string){

        return new Promise<TokenPayload>((resolve,reject) => {
            this.client.verifyIdToken({
                idToken,
                audience: googleAuthConfig.clientID
            }).then( ticket => {

                if(!ticket){
                    reject()
                }else{
                    let payload = ticket.getPayload()
                    resolve(payload)
                }
            }).catch( err => {
                reject(err)
            })
        })
    }

    private createToken(user: IUserModel) : {token: string}{
        const token: string = sign(user._id, user.type === UserType.admin)
        return {token}
    }
}

export const userApi = new UserApi()