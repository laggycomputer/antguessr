export type StartGameResponse = {
    id: string
}

export type Question = {
    id: string
    question: string
    options: number[]
}

export type AnswerResponse = {
    correct: false
    actual: number
    score: number
} | {
    correct: true
    score: number
}
