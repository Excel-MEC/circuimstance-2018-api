import * as express from 'express'
import authRouter from './routers/auth'
import questionRouter from './routers/question'
import userRouter from './routers/user'
import roundRouter from './routers/round'
import adminRouter from './routers/admin'
import * as cors from 'cors'
import * as morgan from 'morgan'


import { getJWTMiddleware } from './middleware/jwt'
import { Socket } from "./utils/socket";


const UNSECURE_ROUES = []

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
        this.express.use('/round',roundRouter)
    }

    private attachMiddleware(): void{
        // cors
        this.express.use(cors())
        // json parser
        this.express.use(express.json())
        // jwt middleware
        let jwtmiddleware = getJWTMiddleware([])
        this.express.use(jwtmiddleware)

        // log HTTP requests
        this.express.use(morgan('combined'));
    }
}


const app = new App().express


// add websockets to express server
const socketServer = new Socket(app)

// export socketserver
export const socketio = socketServer.io

export default socketServer.server
