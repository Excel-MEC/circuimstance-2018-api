import { IAnswer } from './answer'
export enum QuestionType{
    regular,
    bonus
}

export interface IQuestion{
    round: number
    point: number
    type: QuestionType
    title: string
    description: string
    imageURL: string
    answer: IAnswer 
}

