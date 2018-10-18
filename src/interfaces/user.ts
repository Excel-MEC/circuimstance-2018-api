export interface IAnsweredQuestion{
    round: number
    questionId: string
}

export interface IUser{
    fullName: string
    providerId: string
    score: number
    bonusScore: number
    round: number
    lastScoreUpdate: Date
    roundCleared: boolean
    imageURL?: string

    answeredQuestions: IAnsweredQuestion[]
}