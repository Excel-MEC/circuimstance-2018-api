import { Request, Response } from 'express'

export function handleErrors(fn: (req: Request,res :Response) => void){
    return function(req: Request, res: Response){
        try{
            fn(req,res)
        }catch(err){
            console.log(`Error while handling request: ${err}`)
            res.sendStatus(500)
        }
    }
}