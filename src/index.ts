import app from './App'
import { ErrorRequestHandler } from 'express'

const port  = process.env.PORT || 4000

app.listen(port,(err: ErrorRequestHandler ) => {
    if(err){
        return console.log(err)
    }

    return console.log(`Listening on port ${port}..`)
})