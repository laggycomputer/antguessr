export type StartGameResponse = {
    id: string
}

export type Question = {
    id: string
    question: string
    options: number[]
}

export type AnswerResponse = {
    correct: boolean
    actual?: number
}
