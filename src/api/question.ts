import { Question }  from '../schemas/question'
import { Request, Response } from 'express'
import { User } from '../schemas/user'
import { QuestionType, IQuestion } from '../interfaces/question'
import { AnswerType, IAnswer } from '../interfaces/answer';
import { IAnsweredQuestion } from '../interfaces/user'
import { Types } from 'mongoose';

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

    public checkAnswer(req: Request, res: Response){     // POST
        const questionId: string = req.body.id
        const answer: string | number = req.body.answer
        this.getUserEligibility(req.user.id)
            .then((userEligibility: UserEligibility) => {
                if(userEligibility.answeredQuestions.filter(item => item.questionId === questionId).length > 0){
                    res.sendStatus(401)
                }else{
                    Question.findOne(questionId)
                            .then(question => {
                                if(!question){
                                    res.sendStatus(400)
                                }else if(question.round === userEligibility.roundEligible ){
                                    
                                    var isAnswerCorrect: boolean = false
                                    
                                    // if the user is attempting a bonus question with being eligible for it
                                    if(question.type === QuestionType.bonus && !userEligibility.bonusEligible){
                                        res.sendStatus(401)
                                    }else if(question.answer.answerType === AnswerType.numeric){
                                        if(typeof answer !== 'number' ){
                                            res.sendStatus(400)
                                        }else if(question.answer.numericAnswer && question.answer.answerPrecision){
                                            isAnswerCorrect = Math.abs(question.answer.numericAnswer - answer) >= question.answer.answerPrecision
                                        }
                                    }else if(question.answer.answerType === AnswerType.text){
                                        if(typeof answer !== 'string'){
                                            res.sendStatus(400)
                                        }else if(question.answer.answerRegex){
                                            isAnswerCorrect = RegExp(question.answer.answerRegex).test(answer)
                                        }
                                    }else{
                                        console.log(`Encountered unknown answer type`)
                                        res.sendStatus(500)
                                    }

                                    if(isAnswerCorrect){
                                        this.updateUserScore(req.user.id,questionId,question.point,
                                                    userEligibility.roundEligible,userEligibility.score,
                                                    question.type === QuestionType.bonus)
                                            .then( () => {
                                                res.sendStatus(200)
                                            })
                                            .catch((err: any) => {
                                                console.log(`Error while updating user(${req.user.id}) score: ${err}`)
                                                res.sendStatus(500)
                                            })
                                    }

                                }else{
                                    res.sendStatus(401)
                                }
                            })
                        }
                })

    }

    public getQuestions(req: Request, res: Response){    // GET
        this.getUserEligibility(req.user.id)
            .then( (userEligibility: UserEligibility) => {
                
                // fetch all regular questions for the round
                Question.find({ 
                    round: userEligibility.roundEligible, 
                    type: QuestionType.regular,
                },{ answer: 0 })
                .then(questions => {

                    let answeredQuestions: string[] = userEligibility.answeredQuestions.map( item => item.questionId)
                    res.json({
                        questions,
                        answeredQuestions
                    })
                })
                .catch( err => {
                    console.log(`Error while fetching questions for round ${userEligibility.roundEligible} from user ${req.user.id}: ${err}`)
                    res.sendStatus(500)
                })
            })
            .catch( (err: string) => {
                console.log(`Error fetching user eligible round from user ${req.user.id}: ${err}`)
                res.sendStatus(500)
            })
    }

    public getBonusQuestions(req: Request, res: Response){  // GET
        this.getUserEligibility(req.user.id)
            .then( (userEligibility: UserEligibility) => {
                
                // fetch all regular questions for the round
                Question.find({ round: userEligibility.roundEligible, type: QuestionType.bonus },{ answer: 0 })
                .then(questions => {
                    res.json({
                        questions
                    })
                })
                .catch( err => {
                    console.log(`Error while fetching bonus questions for round ${userEligibility.roundEligible} from user ${req.user.id}: ${err}`)
                    res.sendStatus(500)
                })

            })
            .catch( (err: string) => {
                console.log(`Error fetching user eligible round from user ${req.user.id}: ${err}`)
                res.sendStatus(500)
            })
    }

    private getUserEligibility(userId: number){
        return new Promise<UserEligibility>((resolve,reject) => {
            User.findById(userId,{roundCleared: 1, round: 1, answeredQuestions: 1})
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
        return new Promise<void>((resolve,reject) => {
            Question.find({round, type: QuestionType.regular})
                    .then( res => {
                        let points: number = res.map(item => item.point).reduce((acc,cur) => acc+cur)
                        let roundCleared: boolean = (score + point) >= points
                        let now: Date = new Date()
                        User.updateOne({
                            _id: Types.ObjectId(userId),
                        },{
                            $set:{ roundCleared: (roundCleared && !isBonus), score: (score + point), lastScoreUpdate: now }
                        })
                         .then( () => resolve() )
                         .catch( err => reject(err))
                    } )
                    .catch( err => reject(err))
        })
    }
}

export const questionApi =  new QuestionsApi()