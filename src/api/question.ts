import { Question, IQuestionModel }  from '../schemas/question'
import { Request, Response } from 'express'
import { User } from '../schemas/user'
import { QuestionType, IQuestion } from '../interfaces/question'
import { AnswerType, IAnswer } from '../interfaces/answer';
import { IAnsweredQuestion } from '../interfaces/user'
import { Types } from 'mongoose';
import LeaderboardApi from './leaderboard'
export interface UserEligibility{
    roundEligible: number
    bonusEligible: boolean
    answeredQuestions: IAnsweredQuestion[]
    score: number
}

class QuestionsApi{

    constructor(){
        this.checkAnswer = this.checkAnswer.bind(this)
        this.getBonusQuestions = this.getBonusQuestions.bind(this)
        this.getQuestions = this.getQuestions.bind(this)
        this.createQuestion = this.createQuestion.bind(this)
    }

    public deleteQuestion(req: Request, res: Response){
        const questionId: string = req.body.id

        Question.findByIdAndDelete(questionId)
                .then(() => res.sendStatus(200))
                .catch((err) => {
                    console.log(`Error deleting question: ${err}`)
                    res.sendStatus(400)
                })
    }

    public updateQuestion(req: Request, res: Response){
        const answer: IAnswer = req.body.answerisNumeric?{
            answerType: AnswerType.numeric,
            numericAnswer: req.body.answer,
            answerPrecision: req.body.answerPrecision
        }:{
            answerType: AnswerType.text,
            textAnswer: req.body.answer,
            answerRegex: req.body.answerRegex
        }

        const setAnswer: any = {}

        for( var key in answer ){
            if(answer[key]){
                setAnswer[key] = answer[key]
            }
        }
        
        const question: IQuestion = {
            round: req.body.round,
            point: req.body.point,
            type: req.body.bonus? QuestionType.bonus: QuestionType.regular,
            title: req.body.title,
            description: req.body.description,
            imageURL: req.body.imageURL,
            answer
        }

        const setQuestion: any = {}

        for( var key in question ){
            if(question[key] && key !== 'answer'){
                setQuestion[key] = question[key]
            }
        }

        const questionId: string = req.body.id

        Question.findByIdAndUpdate(
            questionId,{
            $set: setQuestion,
            answer: { $set: setAnswer}
        },{new:true}).then(question => {
            res.json({question})
        }).catch( err => {
            res.sendStatus(400)
        })
    }

    public createQuestion(req: Request, res: Response){  // POST
        
        const answer: IAnswer = req.body.answerisNumeric?{
            answerType: AnswerType.numeric,
            numericAnswer: req.body.answer,
            answerPrecision: req.body.answerPrecision
        }:{
            answerType: AnswerType.text,
            textAnswer: req.body.answer,
            answerRegex: req.body.answerRegex
        }
        
        const question: IQuestion = {
            round: req.body.round,
            point: req.body.point,
            type: req.body.bonus? QuestionType.bonus: QuestionType.regular,
            title: req.body.title,
            description: req.body.description,
            imageURL: req.body.imageURL,
            answer
        }

        Question.create(question)
                .then( newQuestion => {
                    res.json({question: newQuestion})
                })
                .catch( err => {
                    console.log(`Error creating question: ${err}`)
                    res.sendStatus(500)
                } )
    }

    public async checkAnswer(req: Request, res: Response){
        const questionId: string | undefined = req.body.id

        if( typeof questionId !== 'string'){
            console.log('checkAnswer: Invalid question id')
            return res.sendStatus(400)
        }

        const answer: string | number = req.body.answer

        if( typeof answer !== 'string' && typeof answer !== 'number' ){
            console.log('checkAnswer: Invalid answer type')
            return res.sendStatus(400)
        }

        var user: UserEligibility;

        try{
            user = await this.getUserEligibility(req.user.sub)
        }catch(e){
            console.log('checkAnswer: Unable to fetch user: ',e)
            return res.sendStatus(500)
        } 

        // check if question is already answered
        const eligibleQuestion: IAnsweredQuestion[] = user.answeredQuestions.filter( q => q.questionId.toString() === questionId)

        if(eligibleQuestion.length > 0){
            console.log('checkAnswer: Question already answered')
            return res.sendStatus(401)
        }

        var question: IQuestionModel | null;

        try{
            question = await Question.findById(questionId)
        }catch(e){
            console.log('checkAnwer: Error fetching question: ',e)
            return res.sendStatus(500)
        }

        if(!question){
            console.log('checkAnswer: Question not found')
            return res.sendStatus(400)
        }

        if(question.round !== user.roundEligible){
            console.log('checkAnswer: User not eligible for the round')
            return res.sendStatus(401)
        }

        let isAnswerCorrect: boolean = false

        if( question.type === QuestionType.bonus && !user.bonusEligible){
            console.log('checkAnswer: User not eligible for bonus question')
            return res.sendStatus(401)
        }
        
        if( question.answer.answerType === AnswerType.numeric){
            if(!question.answer.numericAnswer || !question.answer.answerPrecision){
                console.log('answerCheck: Error in question format')
                return res.sendStatus(500)
            }
            if(typeof answer === 'number'){
                isAnswerCorrect = Math.abs(question.answer.numericAnswer - answer) <= question.answer.answerPrecision
            }else{
                console.log('checkAnswer: Expected numeric answer')
                return res.sendStatus(400)
            }
        }else{
            if(!question.answer.textAnswer || !question.answer.answerRegex){
                console.log('answerCheck: Error in question format')
                return res.sendStatus(500)
            }

            if(typeof answer === 'string'){
                isAnswerCorrect = RegExp(question.answer.answerRegex).test(answer)
            }else{
                console.log('checkAnswer: Expected text answer')
                return res.sendStatus(400)
            }

        }

        if(isAnswerCorrect){
            try{
                await this.updateUserScore(req.user.sub,questionId,question.point,question.round,user.score,user.bonusEligible)
            }catch(e){
                console.log('answerCheck: Error updating score')
                return res.sendStatus(500)
            }

            return res.json({ correct: true })
        }

        return res.json({correct: false })

    }

    public getQuestions(req: Request, res: Response){    // GET
        this.getUserEligibility(req.user.sub)
            .then( (userEligibility: UserEligibility) => {
                
                // fetch all regular questions for the round
                Question.find({ 
                    round: userEligibility.roundEligible, 
                },{ answer: 0 })
                .then(questions => {

                    var bonusQuestionCount = 0;
                    const regularQuestions = []

                    for(var q of questions){
                        if(q.type === QuestionType.bonus){
                            bonusQuestionCount++
                        }else{
                            regularQuestions.push(q)
                        }
                    }


                    let answeredQuestions: string[] = userEligibility.answeredQuestions.map( item => item.questionId.toString())
                    res.json({
                        questions: regularQuestions,
                        answeredQuestions,
                        bonusQuestionCount
                    })
                })
                .catch( err => {
                    console.log(`Error while fetching questions for round ${userEligibility.roundEligible} from user ${req.user.sub}: ${err}`)
                    res.sendStatus(500)
                })
            })
            .catch( (err: string) => {
                console.log(`Error fetching user eligible round from user ${req.user.sub}: ${err}`)
                res.sendStatus(500)
            })
    }

    public getBonusQuestions(req: Request, res: Response){  // GET
        this.getUserEligibility(req.user.sub)
            .then( (userEligibility: UserEligibility) => {
                
                // fetch all regular questions for the round
                Question.find({ round: userEligibility.roundEligible, type: QuestionType.bonus },{ answer: 0 })
                .then(questions => {
                    res.json({
                        questions
                    })
                })
                .catch( err => {
                    console.log(`Error while fetching bonus questions for round ${userEligibility.roundEligible} from user ${req.user.sub}: ${err}`)
                    res.sendStatus(500)
                })

            })
            .catch( (err: string) => {
                console.log(`Error fetching user eligible round from user ${req.user.sub}: ${err}`)
                res.sendStatus(500)
            })
    }

    private getUserEligibility(sub: string){
        return new Promise<UserEligibility>((resolve,reject) => {
            User.findOne({sub},{roundCleared: 1, round: 1, answeredQuestions: 1, score: 1})
                .then( (res) => {

                    if(!res){
                        reject(Error('No such user'))
                    }else{
                        let userEligibility: UserEligibility = {
                            bonusEligible: res.roundCleared,
                            roundEligible: res.round,
                            score: res.score,
                            answeredQuestions: res.answeredQuestions
                                                .filter(item => item.round === res.round)
                        }

                        resolve(userEligibility)
                    }
                })
                .catch( err => {
                    reject(err)
                })
        })
    }

    private updateUserScore(userId: string,questionId: string,point: number,round: number, score: number, isBonus: boolean){
        return new Promise<void>(async (resolve,reject) => {
            Question.find({round, type: QuestionType.regular})
                    .then( res => {
                        let points: number = res.map(item => item.point).reduce((acc,cur) => acc+cur)
                        let roundCleared: boolean = (score + point) >= points
                        let now: Date = new Date()
                        let $set: any = { roundCleared: (roundCleared && !isBonus), score: (score + point), lastScoreUpdate: now }
                        let $push: any = { answeredQuestions: <IAnsweredQuestion>{
                            questionId,
                            round
                        } }
                        User.updateOne({
                            _id: Types.ObjectId(userId),
                        },{
                            $set,
                            $push
                        })
                         .then( async () => {
                             try{
                                await LeaderboardApi.updateScore(userId,score+point,now)
                             }catch(e){
                                 console.log('updateScore: Error updating leaderboard: ',e)
                                 reject()
                             }
                             resolve()
                        })
                         .catch( err => reject(err))
                    } )
                    .catch( err => reject(err))
        })
    }
}

export const questionApi =  new QuestionsApi()