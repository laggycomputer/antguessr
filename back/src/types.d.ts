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

export type EnterNameReponse = {
    ranking?: number
}

export type HighScore = { score: number, name: string }
