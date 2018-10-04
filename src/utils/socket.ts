import * as io from 'socket.io'
import { Server } from 'http'
import { Express } from 'express'

export class Socket{
    public server: Server
    public io: io.Server

    constructor(app: Express){
        this.server = new Server(app)
        this.io = io(this.server)
    }

}