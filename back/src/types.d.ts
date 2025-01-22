import { paths } from "./anteaterapi"

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

type GradeData = paths["/v2/rest/grades/aggregateByCourse"]["get"]["responses"]["200"]["content"]["application/json"]["data"][0]
export type SavedOffering = [[string, string, string], GradeData | undefined]
