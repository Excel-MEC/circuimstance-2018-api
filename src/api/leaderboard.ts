import zset from '../utils/zset'
import { socketio } from '../App'
import { User } from '../schemas/user';
import { Types } from 'mongoose';
import { Socket } from 'socket.io';
import { LEADERBOARD_SNAPSHOT } from '../config/socket';
import { Request, Response } from 'express';

class LeaderboardApi{
    private zset = zset
    private count = 5

    private TIME_MIN: number
    
    public onClientJoin(socket: Socket){
        console.log("WS client connected")
        this.getLeaderboardSnapShot()
            .then( snapshot => {
                socket.emit(LEADERBOARD_SNAPSHOT,{snapshot})
                console.log("leaderboard snapshot sent")
            })
    }

    public async forcePopulateZset(req: Request, res: Response){
        try{
            await this.populateZset()
            res.sendStatus(200)
        }catch(e){
            console.log(`Failed to populate zset: ${e}`)
            res.sendStatus(500)
        }
    }

    public async updateScore(userId: string, score: number, lastScoreUpdate: Date){
        const delta = lastScoreUpdate.getSeconds() - this.TIME_MIN
        console.log("adding score to zset: ", delta)
        this.zset.zadd(score - Math.tanh(delta) ,userId)

        var snapshot: any

        try{
            snapshot = await this.getLeaderboardSnapShot() 
        }catch(e){
            console.log('updateScore: Error fetching leaderboard snapshot')
            return 
        }
        socketio.emit(LEADERBOARD_SNAPSHOT,{snapshot})
    }

    private async getLeaderboardSnapShot(){
        const userIds = (await this.zset.zrange(-this.count,-1)).reverse()
        const $in = userIds.map( item => Types.ObjectId(item))
        const users = await User.find({_id: {$in}},{ score:1, imageURL: 1, fullName: 1 })

        const ranks = await Promise.all(users.map( user => 
            this.zset.zrevrank(user._id.toString())
        ))

        const data: any = {}
        for(var i = 0; i < users.length; ++i){
            const { score, _id, fullName, imageURL } = users[i]
            data[users[i]._id.toString()] = {
                score,
                fullName,
                imageURL,
                _id: _id.toString(),
                rank: ranks[i]
            }
        }

        const dataOrdered = []

        for(var id of userIds){
            dataOrdered.push(data[id])
        }

        return dataOrdered
    }
    
    public async populateZset(){
        console.log("Populating redis")
        await this.zset.del()
        const userlist = await User.find({},{_id:1,score:1, lastScoreUpdate:1})
        const firstUser = await User.findOne({},{lastScoreUpdate: 1}).sort({lastScoreUpdate:-1})
        if(!firstUser){
            throw Error(`Cannot find start time`)
        }

        this.TIME_MIN = firstUser.lastScoreUpdate.getSeconds()
        
        for(var i = 0; i < userlist.length; ++i ){
            const user = userlist[i]
            const delta = user.lastScoreUpdate.getSeconds() - firstUser.lastScoreUpdate.getSeconds()
            console.log("user: ",user," delta: ",delta," rank score: ",user.score - Math.tanh(delta))
            await this.zset.zadd(user.score - Math.tanh(delta),user._id.toString())
        }

        console.log("Done populating redis cache")

    }

    constructor() {
        this.TIME_MIN = 0
        this.onClientJoin = this.onClientJoin.bind(this)
        this.updateScore = this.updateScore.bind(this)
        this.populateZset = this.populateZset.bind(this)
    }
}


export default new LeaderboardApi()
