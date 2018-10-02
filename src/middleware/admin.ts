import { Request, Response, NextFunction, RequestHandler } from 'express'
export function getAdminMiddleware(): RequestHandler{
    return (req: Request, res: Response, next: NextFunction ) => {
        if(req.user.admin === true){
            return next()
        }else{
            console.log(`Tried to access admin route by unauthorized user: ${req.user.id}`)
            res.sendStatus(401)
        }
    }
}