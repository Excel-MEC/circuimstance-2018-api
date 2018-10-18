import { Schema, Model, model } from 'mongoose'

import { IRoundModel, AnswerType, QuestionType } from '../interfaces/round'

const QuestionSchema = new Schema({

    point: {
        required: true,
        type: Number,
        default: 0
    },
    type:{
        required: true,
        type:Number,
        default: QuestionType.regular,
    },
    imageURL:{
        type: String,
        default: ''
    },
    title: {
        required: true,
        type: String
    },
    description: {
        required: false,
        type: String
    },
    answerType: {
        required: true,
        default: AnswerType.numeric,
        type: Number
    },
    answer: {
        required: true,
        type: Schema.Types.Mixed
    },
    precision: {
        required: false,
        type: Number
    },
})

export const RoundSchema = new Schema({
    roundName: {
        required: true,
        type: String
    },
    roundNum: {
        required: true,
        type: Number,
        default: 0,
        unique: true
    },
    qualifyingScore:{
        required: true,
        type: Number
    },
    imageURL:{
        type: String
    },
    decription:{
        type: String
    },
    openingTime:{
        required: true,
        type: Number
    },
    questions: [QuestionSchema]
})

export const Round: Model<IRoundModel> = model("Round",RoundSchema)