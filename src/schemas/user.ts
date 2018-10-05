import { Document, Schema, Model, model } from 'mongoose'
import { IUser, UserType } from '../interfaces/user'

export interface IUserModel extends IUser, Document{
}

export const UserSchema: Schema = new Schema({
    email:{
        type: String,
        required: true,
        trim: true,
        match: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
    },
    
    fullName: {
        type: String,
        required: true
    },
    
    providerId: {
        type: String,
        required: true
    },
    imageURL: {
        type: String,
        required: false
    },
    score: {
        type: Number,
        required: true,
        default: 0
    },
    round: {
        type: Number,
        required: true,
        default: 0
    },
    
    lastScoreUpdate: Date,
    
    type: {
        type: Number,
        required: true,
        default: UserType.regular
    },
    roundCleared: { 
        type: Boolean,
        default: false
    },
    answeredQuestions: [{
        round: Number,
        questionId: String
    }]


})

UserSchema.pre<IUserModel>("save",function (next): void {
    let now = new Date()
    if(!this.lastScoreUpdate){
        this.lastScoreUpdate = now
    }
    next()
})

export const User: Model<IUserModel> = model<IUserModel>("User",UserSchema)