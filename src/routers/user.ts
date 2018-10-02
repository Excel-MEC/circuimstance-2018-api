import { Router } from 'express'
import { userApi } from '../api/user'

const router: Router = Router()

router.get('/',userApi.getUserInfo)


export default router