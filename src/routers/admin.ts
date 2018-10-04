import { Router, RequestHandler } from 'express'
import { getAdminMiddleware } from '../middleware/admin'
import { questionApi } from '../api/question'
import { handleErrors } from '../utils/wrappers'

const router: Router = Router()


// attach the admin middleware
let adminMiddleware: RequestHandler = getAdminMiddleware() 
router.use(adminMiddleware)

router.post('/createQuestion', handleErrors(questionApi.createQuestion) )
router.post('/updateQuestion', handleErrors(questionApi.updateQuestion) )
router.post('/deleteQuestion', handleErrors(questionApi.deleteQuestion) )

export default router
