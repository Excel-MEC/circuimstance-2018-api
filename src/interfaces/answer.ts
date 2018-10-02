export enum AnswerType{
    numeric,
    text
}

export interface IAnswer{
    answerType: AnswerType
    numericAnswer?: number
    textAnswer?: string
    answerPrecision?: number
    answerRegex?: string

    [key: string]: any

}