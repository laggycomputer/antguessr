"use client"

import { useEffect, useState } from "react"
import { AnswerResponse, Question, StartGameResponse } from "../../back/src/types"

export default function QuizApp() {
    const [session, setSession] = useState<string | undefined>()
    const [currentQuestion, setCurrentQuestion] = useState<Question | undefined>()
    const [score, setScore] = useState(0)
    const [gameOver, setGameOver] = useState(false)

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

    const resetQuiz = async () => {
        const { id } = (await fetch("/api/start-game", { method: "POST" }).then(r => r.json()) as StartGameResponse)
        setSession(id)
        getNextQuestion(id)
        setScore(0)
        setGameOver(false)
    }

    if (currentQuestion === undefined) {
        return <div>Loading...</div>
    }

    return (
        <div>
            <h1>Quiz App</h1>
            {gameOver ? (
                <div>
                    <h2>Game over! Your score: {score}</h2>
                    <button onClick={resetQuiz}>Retry</button>
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
                </div>
            )}
        </div>
    )
}
