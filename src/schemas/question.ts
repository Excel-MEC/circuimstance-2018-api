import { Document, Schema, Model, model } from 'mongoose'
import { IQuestion } from '../interfaces/question'
import { AnswerType } from '../interfaces/answer';

export interface IQuestionModel extends IQuestion, Document{
}

export const QuestionSchema: Schema = new Schema({
    round: Number,
    point: Number,
    type: Number,
    title: String,
    description: String,
    imageURL: String,
    answer: {
        answerType: Number,
        numericAnswer: Number,
        answerPrecision: Number,
        answerRegex: String
    } 
})

export const Question: Model<IQuestionModel> = model<IQuestionModel>("Question", QuestionSchema)