import { Router, RequestHandler } from 'express'
import { getAdminMiddleware } from '../middleware/admin'
import { questionApi } from '../api/question'

const router: Router = Router()


// attach the admin middleware
let adminMiddleware: RequestHandler = getAdminMiddleware() 
router.use(adminMiddleware)

router.post('/createQuestion', questionApi.createQuestion )
router.post('/updateQuestion', questionApi.updateQuestion )
router.post('/deleteQuestion', questionApi.deleteQuestion )

export default router
