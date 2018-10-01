

export enum UserType{
    admin,
    regular
}



export interface IAnsweredQuestion{
    round: number
    questionId: string
}

export interface IUser{
    email: string
    fullName: string
    providerId: string
    score: number
    type: UserType
    round: number
    lastScoreUpdate: Date
    roundCleared: boolean
    imageURL?: string

    answeredQuestions: IAnsweredQuestion[]
}