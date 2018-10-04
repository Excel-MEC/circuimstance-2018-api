import { Router } from 'express'
import { questionApi } from '../api/question'
import { handleErrors } from '../utils/wrappers'

const router: Router = Router()

router.get('/',handleErrors(questionApi.getQuestions))
router.get('/bonus',handleErrors(questionApi.getBonusQuestions))
router.post('/check',handleErrors(questionApi.checkAnswer))

export default router


