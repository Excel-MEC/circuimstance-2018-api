import { ErrorRequestHandler } from 'express'
import * as mongoose from 'mongoose'

import * as path from 'path' 
import * as dotenv from 'dotenv'


dotenv.config({
    path: path.resolve(process.cwd(),'.env')
})

import LeaderboardApi from './api/leaderboard'
import app from './App'
import { MONGO_CONN_STRING } from './config/mongodb'
import { promisify } from 'util'

import './routers/ws'







// port to listen on
const port  = process.env.PORT || 4000

Promise.all([
    //connect to db
    (() => {
        console.log('connecting to db..')
        return mongoose.connect(MONGO_CONN_STRING,{ useNewUrlParser: true })}
    )(),

]).then( async () => {
    // populate the redis zset
    promisify(LeaderboardApi.populateZset)()


    console.log("starting the app...")
    // start the app
    app.listen(port,(err: ErrorRequestHandler ) => {
        if(err){
            return console.log(err)
        }

        return console.log(`Listening on port ${port}..`)
    })
}).catch( err => {
    console.log(`Error starting the app: ${err}`)
})