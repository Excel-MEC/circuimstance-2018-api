import { Round } from '../schemas/round'
import { User, IUserModel } from '../schemas/user'
import { QuestionType, AnswerType, IRoundModel } from '../interfaces/round'

import LeaderboardApi from '../api/leaderboard'

import { Request, Response } from 'express';
import { IAnsweredQuestion } from '../interfaces/user';

class RoundApi{

    public async checkAnswer(req: Request, res: Response){
        const sub = req.user.sub
        const questionId = req.body.id
        const answer = req.body.answer

        var levelComplete: boolean = false

        var user: IUserModel | null
        try{
            user = await User.findOne({providerId:sub})
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

        if(round.openingTime > Date.now()){
            levelComplete = true
        }else{

            for(var q of user.answeredQuestions){
                if(q.questionId === questionId)
                    return res.sendStatus(401)
            }

            const questions = round.questions.filter( question => question._id.toString() === questionId)

            if(questions.length !== 1) return res.sendStatus(400)

            const question = questions[0]

            if((user.score - user.bonusScore) < round.qualifyingScore && question.type === QuestionType.bonus) return res.sendStatus(401)

            var isAnswerCorrect = false

            if(question.answerType === AnswerType.numeric && typeof answer === 'number' && typeof question.answer === 'number'){
                isAnswerCorrect = Math.abs(answer - question.answer) <= question.precision
            }else if(question.answerType === AnswerType.text && typeof answer === 'string' && typeof question.answer === 'string'){
                isAnswerCorrect = RegExp(question.answer).test(answer)
            }else{
                console.log('Invalid answer')
                return res.sendStatus(400)
            }

            if(isAnswerCorrect){
                const now = new Date()

                const newScore = user.score + question.point
                var newBonusScore = user.bonusScore

                if(question.type === QuestionType.bonus){
                    newBonusScore += question.point
                }

                user.set({
                    answeredQuestions: user.answeredQuestions.concat([
                        <IAnsweredQuestion>{
                            questionId,
                            round: round.roundNum
                        }
                    ]),
                    bonusScore: newBonusScore,
                    score: newScore,
                    lastScoreUpdate: now
                })

                try{
                    await Promise.all([
                        user.save(),
                        LeaderboardApi.updateScore(user._id.toString(),newScore,now)
                    ])
                }catch(e){
                    console.log('Error updating user score: ',e)
                    return res.sendStatus(500)
                }

            }

            const bonusEligible: boolean = user.score >= round.qualifyingScore

            const currentRound = round.roundNum

            const answeredQuestions = user.answeredQuestions.filter(q => q.round === currentRound ).map( q => q.questionId )
            

            return res.json({
                roundName: round.roundName,
                imageURL: round.imageURL,
                description: round.description,
                bonusEligible,
                levelComplete,
                questions: round.questions.map( (question ) => ({
                    id: question._id.toString(),
                    answered: answeredQuestions.indexOf(question._id.toString()) !== -1,
                    isBonus: question.type === QuestionType.bonus,
                    title: !bonusEligible && question.type === QuestionType.bonus? '': question.title,
                    description: !bonusEligible && question.type === QuestionType.bonus?'': question.description,
                    isNumeric: question.answerType === AnswerType.numeric
                }))
            })
        }        

        return res.json({
            roundName: round.roundName,
            imageURL: round.imageURL,
            description: round.description,
            bonusEligible: false,
            questions: [],
            levelComplete
        })
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
            user = await User.findOne({providerId:sub})
        }catch(e){
            console.log('Error fetching user: ',e)
            return res.sendStatus(500)
        }

        console.log("user fetched ",user)

        if(!user) return res.sendStatus(400)

        var round
        try{
            round = await Round.findOne({roundNum:user.round})
        }catch(e){
            console.log('Error fetching round: ',e)
        }

        console.log("round fetched: ",round)

        if(!round) return res.sendStatus(500)

        if((user.score - user.bonusScore) < round.qualifyingScore){
            return res.sendStatus(401)
        }

        console.log("setting user")

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
        var levelComplete: boolean = false

        try{
            user = await User.findOne({providerId: sub})
        }catch(e){
            console.log('Error fetching user: ',e)
            return res.sendStatus(500)
        }
        console.log("user fetched")

        if(!user){ 
            console.log("user does not exist",user)
            return res.sendStatus(400)
        }


        var round
        try{
            round = await Round.findOne({roundNum:user.round})
        }catch(e){
            console.log('Error fetching round: ',e)
            return res.sendStatus(500)
        }

        if(!round) return res.sendStatus(500)
        console.log(round,round.openingTime, Date.now())
        if(round.openingTime > Date.now()){
            levelComplete = true
        }else{

            const bonusEligible: boolean = user.score >= round.qualifyingScore

            const currentRound = round.roundNum

            const answeredQuestions = user.answeredQuestions.filter(q => q.round === currentRound ).map( q => q.questionId )
            
            return res.json({
                roundName: round.roundName,
                imageURL: round.imageURL,
                description: round.description,
                levelComplete,
                bonusEligible,
                questions: round.questions.map( (question ) => ({
                    id: question._id.toString(),
                    answered: answeredQuestions.indexOf(question._id.toString()) !== -1,
                    isBonus: question.type === QuestionType.bonus,
                    title: !bonusEligible && question.type === QuestionType.bonus? '': question.title,
                    description: !bonusEligible && question.type === QuestionType.bonus?'': question.description,
                    isNumeric: question.answerType === AnswerType.numeric
                }))
            })
        }


        return res.json({
            roundName: round.roundName,
            imageURL: round.imageURL,
            description: round.description,
            bonusEligible: false,
            questions: [],
            levelComplete
        })

        
    }
}

export default new RoundApi()