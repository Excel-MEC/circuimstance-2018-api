import { Request, Response } from 'express'
import { User, IUserModel } from '../schemas/user';
import zset from '../utils/zset';
import LeaderboardApi from '../api/leaderboard'

interface IAuthResponse{
    name: string
    sub: string
    imageURL?: string
}


class UserApi{

    constructor(){
        this.Authenticate = this.Authenticate.bind(this)
    }

    public async getUserInfo(req: Request, res: Response){ //GET
        const sub: string = req.user.sub

        var user;

        try{
            user = await User.findOne({providerId: sub}) 
        }catch(e){
            console.log('Error fetching user: ',e)
            return res.sendStatus(500)
        }

        if(!user){
            console.log('User not found!')
            return res.sendStatus(400)
        }

        try{
            await LeaderboardApi.updateScore(user._id.toString(),user.score,user.lastScoreUpdate)
        }catch(e){
            console.log('Error updating leaderboard: ',e)
            return res.sendStatus(500)
        }

        var rank;

        try{
            rank = await zset.zrevrank(user._id.toString())
        }catch(e){
            console.log('Error fetching rank: ',e)
            return res.sendStatus(500)
        }

        return res.json({
            score: user.score,
            showBonus: user.roundCleared,
            rank: rank + 1,
            answeredQuestions: user.answeredQuestions
        })
    }

    public async Authenticate(req: Request, res: Response){  // GET

        const authResponse: IAuthResponse = {
            imageURL: req.user.picture,
            name: req.user.name,
            sub: req.user.sub
        }

        var user;

        try{
            user = await User.findOne({providerId: authResponse.sub})
        }catch(e){
            console.log("Error fetching user: ",e)
            return res.sendStatus(500)
        }

        if(!user){
            try{
                user = await User.create(<IUserModel>{
                    fullName: authResponse.name,
                    providerId: authResponse.sub,
                    imageURL: authResponse.imageURL
                })
            }catch(e){
                console.log('Error creating new user: ',e)
                return res.sendStatus(500)
            }
        }else{
            user.set(<IUserModel>{
                fullName: authResponse.name,
                providerId: authResponse.sub,
                imageURL: authResponse.imageURL
            })

            try{
                await user.save()
            }catch(e){
                console.log('Error updating user: ',e)
                return res.sendStatus(500)
            }
        }

        try{
            await LeaderboardApi.updateScore(user._id.toString(),user.score,user.lastScoreUpdate)
        }catch(e){
            console.log('Error updating leaderboard: ',e)
            return res.sendStatus(500)
        }

        var rank;

        try{
            rank = await zset.zrevrank(user._id.toString())
        }catch(e){
            console.log('Error fetching rank: ',e)
            return res.sendStatus(500)
        }

        return res.json({
            score: user.score,
            showBonus: user.roundCleared,
            rank: rank + 1,
            answeredQuestions: user.answeredQuestions
        })
    }
    
}

export const userApi = new UserApi()