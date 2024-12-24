"use client"

import { FormEvent, useEffect, useState } from "react"
import { AnswerResponse, EnterNameReponse, HighScore, Question, StartGameResponse } from "../../back/src/types"

export default function QuizApp() {
    const [session, setSession] = useState<string | undefined>()
    const [currentQuestion, setCurrentQuestion] = useState<Question | undefined>()
    const [score, setScore] = useState(0)
    const [gameOver, setGameOver] = useState(false)
    const [name, setName] = useState<string>("")
    const [leaderboard, setLeaderboard] = useState<HighScore[]>([])
    const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false)

    const getNextQuestion = async (session: string) => {
        const data = (await fetch("/api/privileged/question", { headers: { "Authorization": `Bearer ${session}` } }).then(r => r.json())) as Question
        setCurrentQuestion(data)
    }

    useEffect(() => {
        (async () => {
            const { id } = (await fetch("/api/start-game", { method: "POST" }).then(r => r.json()) as StartGameResponse)
            setSession(id)
            await getNextQuestion(id)
        })()
    }, [])

    const handleAnswer = async (answer: number) => {
        const { correct } = (await fetch("/api/privileged/answer", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session}` },
            body: JSON.stringify({ answer }),
        }).then(r => r.json()) as AnswerResponse)

        if (correct) {
            setScore(score + 1)
            await getNextQuestion(session as string)
        } else {
            setGameOver(true)
        }
    }

    async function resetQuiz(evt: FormEvent) {
        evt.preventDefault();
        const formData = new FormData(evt.target as HTMLFormElement);
        await fetch("/api/privileged/save-score", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session}` },
            body: JSON.stringify({ name: formData.get("name") })
        }).then(r => r.json()) as EnterNameReponse

        const { id } = (await fetch("/api/start-game", { method: "POST" }).then(r => r.json()) as StartGameResponse)
        setSession(id)
        getNextQuestion(id)
        setScore(0)
        setGameOver(false)
    }

    if (currentQuestion === undefined) {
        return <div>Loading...</div>
    }

    if (showLeaderboard) {
        return (
            <div>
                <h1>Leaderboard</h1>
                <table align="center">
                    <thead>
                        <tr>
                            <td></td>
                            <td align="center">Name</td>
                            <td align="center">Score</td>
                        </tr>
                    </thead>
                    {leaderboard.map(([score, name], index) => <tr>
                        <td align="right">{index + 1}</td>
                        <td align="center">{name}</td>
                        <td align="center">{score}</td>
                    </tr>)}
                </table>
                <button onClick={() => setShowLeaderboard(false)}>Close</button>
            </div>
        )
    }

    return (
        <div>
            <h1>Quiz App</h1>
            {gameOver ? (
                <div>
                    <form onSubmit={resetQuiz}>
                        <h2>Game over! Your score: {score}</h2>
                        <input type="text" placeholder="Enter your name" value={name} onChange={e => setName(e.target.value)} name="name"></input>
                        <button>Retry</button>
                    </form>
                </div>
            ) : (
                <div>
                    <h2>Your score: {score}</h2>
                    <h3>{currentQuestion.question}</h3>
                    <div>
                        {currentQuestion.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => handleAnswer(option)}>
                                {option}
                            </button>
                        ))}
                    </div>
                    <br />
                    <button onClick={async () => {
                        const leaderboard = (await fetch("/api/leaderboard").then(r => r.json())) as HighScore[]
                        setLeaderboard(leaderboard)
                        setShowLeaderboard(true)
                    }}>Leaderboard</button>
                </div>
            )}
        </div>
    )
}
