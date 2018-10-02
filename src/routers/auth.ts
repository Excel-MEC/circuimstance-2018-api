import { Router } from 'express'
import { userApi } from '../api/user'

const router: Router = Router()

router.post('/', userApi.Authenticate)

export default router