import { Document } from "mongoose";

export enum QuestionType{
    regular,
    bonus
}

export enum AnswerType{
    numeric,
    text
}


export interface IQuestionModel extends Document{
    point: number
    type: QuestionType
    title: string
    description: string
    answertype: AnswerType
    answer: string | number
    precision: number
}


export interface IRoundModel extends Document{
    roundNum: number
    roundName: string
    qualifyingScore: number
    imageURL: string

    description: string

    questions: IQuestionModel[]

}