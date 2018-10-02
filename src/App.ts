import * as express from 'express'
import authRouter from './routers/auth'
import questionRouter from './routers/question'
import userRouter from './routers/user'
import adminRouter from './routers/admin'

import { getJWTMiddleware } from './middleware/jwt'


const UNSECURE_ROUES = [
    '/auth'
]

class App{
    public express: express.Express

    constructor(){
        this.express = express()
        this.attachMiddleware()
        this.mountRoutes()
    }

    private mountRoutes(): void{
        this.express.use('/auth',authRouter)
        this.express.use('/user',userRouter)
        this.express.use('/question',questionRouter)
        this.express.use('/admin',adminRouter)
    }

    private attachMiddleware(): void{
        // jwt middleware
        let jwtmiddleware = getJWTMiddleware(UNSECURE_ROUES)
        this.express.use(jwtmiddleware)
    }
}


export default new App().express