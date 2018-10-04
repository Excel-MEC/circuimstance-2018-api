import { ErrorRequestHandler } from 'express'
import * as mongoose from 'mongoose'
import * as dotenv from 'dotenv'
import * as path from 'path' 


dotenv.config({
    path: path.resolve(process.cwd(),'.env')
})

import app from './App'
import { MONGO_CONN_STRING } from './config/mongodb'






// port to listen on
const port  = process.env.PORT || 4000

Promise.all([
    //connect to db
    mongoose.connect(MONGO_CONN_STRING)

]).then( () => {
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