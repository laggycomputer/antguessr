import { AnswerResponse, EnterNameReponse, Question, StartGameResponse } from "../../../back/src/types"

export async function startSession(): Promise<StartGameResponse> {
    const response = await fetch("/api/start-game", { method: "POST" })
    return await response.json()
}

export async function fetchQuestion(session: string): Promise<Question> {
    const headers = { Authorization: `Bearer ${session}` }
    const response = await fetch("/api/privileged/question", { headers })
    return await response.json()
}

export async function checkAnswer(session: string, answer: number): Promise<AnswerResponse> {
    const headers = {
        'Content-Type': "application/json",
        'Authorization': `Bearer ${session}`
    }
    const response = await fetch("/api/privileged/answer", {
        method: "POST",
        headers,
        body: JSON.stringify({ answer })
    })
    return await response.json()
}

export async function recordScore(session: string, name: string): Promise<EnterNameReponse> {
    const headers = {
        'Content-Type': "application/json",
        'Authorization': `Bearer ${session}`
    }
    const response = await fetch("/api/privileged/save-score", {
        method: "POST",
        headers,
        body: JSON.stringify({ name })
    })
    return await response.json()
}
