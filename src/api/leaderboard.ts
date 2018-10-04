import zset from '../utils/zset'
import { socketio } from '../App'
import { User } from '../schemas/user';
import { Types } from 'mongoose';
import { Socket } from 'socket.io';
import { LEADERBOARD_SNAPSHOT } from '../config/socket';
import { promisify } from 'util';
import { Request, Response } from 'express';

class LeaderboardApi{
    private zset = zset
    private count = 5

    private TIME_MIN: number
    
    public async onClientJoin(socket: Socket){
        const snapshot = await this.getLeaderboardSnapShot()
        socket.emit(LEADERBOARD_SNAPSHOT,{snapshot})
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

    public updateScore(userId: string, score: number, lastScoreUpdate: Date){
        const delta = lastScoreUpdate.getSeconds() - this.TIME_MIN
        this.zset.zadd(score - Math.tanh(delta) ,userId)
        promisify(this.getLeaderboardSnapShot)()
        .then(snapshot => socketio.emit(LEADERBOARD_SNAPSHOT,{snapshot}))
        .catch( err => console.log(`Error emitting ${LEADERBOARD_SNAPSHOT}: ${err}`))
    }

    private async getLeaderboardSnapShot(){
        const userIds = (await this.zset.zrange(-this.count,-1)).reverse()
        const $in = userIds.map( item => Types.ObjectId(item))
        const users = await User.find({_id: $in},{ fullName:1,score:1 })

        const ranks = await Promise.all(users.map( user => 
            this.zset.zscore(user._id)
        ))

        const data: any = {}
        for(var i = 0; i < users.length; ++i){
            data[users[i]._id] = {
                ...users,
                rank: ranks[i]
            }
        }

        const dataOrdered = []
        for(var id in userIds){
            dataOrdered.push(data[id])
        }

        return dataOrdered
    }
    
    private async populateZset(){
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
            await this.zset.zadd(user.score - Math.tanh(delta),user._id)
        }

    }

    constructor() {
        this.TIME_MIN = 0
        this.onClientJoin = this.onClientJoin.bind(this)
        this.updateScore = this.updateScore.bind(this)
        this.populateZset()        
    }
}


export default new LeaderboardApi()
