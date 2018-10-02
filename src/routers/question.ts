import { Router } from 'express'
import { questionApi } from '../api/question'

const router: Router = Router()

router.get('/',questionApi.getQuestions)
router.get('/bonus',questionApi.getBonusQuestions)
router.post('/check',questionApi.checkAnswer)

export default router


