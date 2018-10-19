import zset from '../utils/zset'
import { socketio } from '../App'
import { User } from '../schemas/user';
import { Types } from 'mongoose';
import { Socket } from 'socket.io';
import { LEADERBOARD_SNAPSHOT } from '../config/socket';
import { Request, Response } from 'express';

class LeaderboardApi{
    private zset = zset
    private count = 20

    private TIME_MIN: Date
    
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
        const rankScore = this.calculateScore(score,lastScoreUpdate)
        // const delta = lastScoreUpdate.getSeconds() - this.TIME_MIN
        console.log("adding score to zset: ", rankScore)
        this.zset.zadd(rankScore ,userId)

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

    private calculateScore(score: number,lastScoreUpdate: Date){
        const diff = this.TIME_MIN.getTime() - lastScoreUpdate.getTime()
        const timeDelta = Math.round(Math.abs(diff)/100)
        const timeScore = 2*(1/(1+Math.exp(-1e-6*timeDelta)) - 0.5)
	console.log("timeDelta: ",timeDelta, "timeScore: ",timeScore)
        return score - timeScore
    }
    
    public async populateZset(){
        console.log("Populating redis")
        const start_date = 'October 17 2018'
        this.TIME_MIN = new Date(start_date)
        console.log("setting starting time to ",this.TIME_MIN)

        await this.zset.del()
        const userlist = await User.find({},{_id:1,score:1, lastScoreUpdate:1,fullName:1})
        // const firstUser = await User.findOne({},{lastScoreUpdate: 1}).sort({lastScoreUpdate:-1})
        // if(!firstUser){
            // throw Error(`Cannot find start time`)
        // }

        // this.TIME_MIN = firstUser.lastScoreUpdate.getSeconds()
        
        for(var i = 0; i < userlist.length; ++i ){
            const user = userlist[i]
            const rankScore = this.calculateScore(user.score,user.lastScoreUpdate)
            console.log("user: ",user," rank score: " ,rankScore)
            await this.zset.zadd(rankScore,user._id.toString())
        }

        console.log("Done populating redis cache")

    }

    constructor() {
        this.TIME_MIN = new Date()
        this.onClientJoin = this.onClientJoin.bind(this)
        this.updateScore = this.updateScore.bind(this)
        this.populateZset = this.populateZset.bind(this)
    }
}


export default new LeaderboardApi()
