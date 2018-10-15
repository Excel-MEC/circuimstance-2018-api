import { Router } from 'express'
import RoundApi from '../api/round'

const router: Router = Router()

router.get('/',RoundApi.getRound.bind(RoundApi))
router.get('/promote',RoundApi.roundPromote.bind(RoundApi))
router.post('/check',RoundApi.checkAnswer.bind(RoundApi))

export default router