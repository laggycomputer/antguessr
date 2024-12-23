export type StartGameResponse = {
    id: string
}

export type Question = {
    id: string
    question: string
    options: string[]
}

export type ValidateAnswerResponse = {
    correct: boolean
}
