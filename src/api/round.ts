import { Round } from '../schemas/round'
import { User, IUserModel } from '../schemas/user'
import { QuestionType, AnswerType, IRoundModel } from '../interfaces/round'

import LeaderboardApi from '../api/leaderboard'

import { Request, Response } from 'express';

class RoundApi{

    public async checkAnswer(req: Request, res: Response){
        const sub = req.user.sub
        const questionId = req.body.id
        const answer = req.body.answer

        var user: IUserModel | null
        try{
            user = await User.findOne({sub})
        }catch(e){
            console.log('Error fetching user: ',e)
            return res.sendStatus(500)
        }

        if(!user) return res.sendStatus(500)

        var round
        try{
            round = await Round.findOne({roundNum: user.round })
        }catch(e){
            console.log('Error fetching round: ',e)
            return res.sendStatus(500)
        }

        if(!round) return res.sendStatus(500)

        for(var q of user.answeredQuestions){
            if(q === questionId)
                return res.sendStatus(401)
        }

        const questions = round.questions.filter( question => question._id.toString() === questionId)

        if(questions.length !== 1) return res.sendStatus(400)

        const question = questions[0]

        if(user.score < round.qualifyingScore && question.type === QuestionType.bonus) return res.sendStatus(401)

        var isAnswerCorrect = false

        if(question.answertype === AnswerType.numeric && typeof answer === 'number' && typeof question.answer === 'number'){
            isAnswerCorrect = Math.abs(answer - question.answer) <= question.precision
        }else if(question.answertype === AnswerType.text && typeof answer === 'string' && typeof question.answer === 'string'){
            isAnswerCorrect = RegExp(question.answer).test(answer)
        }else{
            console.log('Invalid answer')
            return res.sendStatus(400)
        }

        if(!isAnswerCorrect){
            return res.json({correct: isAnswerCorrect})
        }

        const now = new Date()

        user.set({
            answeredQuestions: user.answeredQuestions.concat([questionId]),
            score: user.score + question.point,
            lastScoreUpdate: now
        })

        try{
            await Promise.all([
                user.save(),
                LeaderboardApi.updateScore(user._id.toString(),user.score,now)
            ])
        }catch(e){
            console.log('Error updating user score: ',e)
            return res.sendStatus(500)
        }

        return res.json({correct:isAnswerCorrect})
    }

    public async deleteRound(req: Request, res: Response){
        const roundId = req.body.id
        try{
            await Round.findById(roundId).remove()
        }catch(e){
            console.log('Error deleting round: ',e)
            return res.sendStatus(500)
        } 

        return res.sendStatus(200)
    }

    public async createRound(req: Request, res: Response){
        const round = new Round(<IRoundModel>{
            roundNum: req.body.roundNum,
            roundName: req.body.roundName,
            qualifyingScore: req.body.roundName,
            imageURL: req.body.imageURL,
            description: req.body.description,
            questions: req.body.questions.map( (question: any) => ({
                point: question.point,
                type: question.isBonus?QuestionType.bonus:QuestionType.regular,
                title: question.title,
                description: question.description,
                answerType: question.isNumeric?AnswerType.numeric:AnswerType.text,
                answer: question.answer,
                precision: question.precision
            }))
        })

        try{
            await round.save()
        }catch(e){
            console.log('Error creating Round: ',e)
            return res.sendStatus(500)
        }

        return res.sendStatus(200)
    } 

    public async roundPromote(req: Request, res: Response){
        var user
        const sub = req.user.sub
        try{
            user = await User.findOne({sub})
        }catch(e){
            console.log('Error fetching user: ',e)
            return res.sendStatus(500)
        }

        if(!user) return res.sendStatus(400)

        var round
        try{
            round = await Round.findOne({roundNum:user.round})
        }catch(e){
            console.log('Error fetching round: ',e)
        }

        if(!round) return res.sendStatus(500)

        if(user.score < round.qualifyingScore){
            return res.sendStatus(401)
        }

        user.set({
            round: user.round + 1
        })

        try{
            await user.save()
        }catch(e){
            console.log('Error saving user: ',e)
            return res.sendStatus(500)
        }

        return res.sendStatus(200)
    }
    public async getRound(req: Request, res: Response){
        var user
        const sub = req.user.sub
        try{
            user = await User.findOne({sub})
        }catch(e){
            console.log('Error fetching user: ',e)
            return res.sendStatus(500)
        }

        if(!user) return res.sendStatus(400)

        var round
        try{
            round = await Round.findOne({roundNum:user.round})
        }catch(e){
            console.log('Error fetching round: ',e)
        }

        if(!round) return res.sendStatus(500)

        const bonusEligible: boolean = user.score >= round.qualifyingScore

        return res.json({
            roundName: round.roundName,
            imageURL: round.imageURL,
            description: round.description,
            bonusEligible,
            questions: round.questions.map( (question ) => ({
                id: question._id.toString(),
                isBonus: question.type === QuestionType.bonus,
                title: !bonusEligible && question.type === QuestionType.bonus? '': question.title,
                description: !bonusEligible && question.type === QuestionType.bonus?'': question.description,
                isNumeric: question.answertype === AnswerType.numeric
            }))
        })
    }
}

export default new RoundApi()