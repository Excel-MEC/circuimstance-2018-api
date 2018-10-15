import { Router } from 'express'
import { userApi } from '../api/user'
import { handleErrors } from '../utils/wrappers'

const router: Router = Router()

router.get('/', handleErrors(userApi.Authenticate))

export default router