"use client"

import { StartGameResponse } from "../../back/src/types"
import { useEffect, useState } from "react"

type Question = {
    id: string
    question: string
    options: string[]
}

export default function QuizApp() {
    const [session, setSession] = useState<string | undefined>()
    const [currentQuestion, setCurrentQuestion] = useState<Question | undefined>()
    const [score, setScore] = useState(0)
    const [showScore, setShowScore] = useState(false)

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

    const handleAnswer = async (answerIndex: number) => {
        // const { correct } = (await fetch("/api/privileged/validate-answer", {
        //     method: "POST",
        //     headers: { "Content-Type": "application/json" },
        //     body: JSON.stringify({ questionId: (currentQuestion as Question).id, answerIndex }),
        // }).then(r => r.json()) as ValidateAnswerResponse)

        // if (correct) {
        //     setScore(score + 1)
        //     await getNextQuestion(session as string)
        // } else {
        //     setShowScore(true)
        // }
    }

    const resetQuiz = () => {
        getNextQuestion(session as string)
        setScore(0)
        setShowScore(false)
    }

    if (currentQuestion === undefined) {
        return <div>Loading...</div>
    }

    return (
        <div>
            <h1>Quiz App</h1>
            {showScore ? (
                <div>
                    <h2>Your score: {score}</h2>
                    <button onClick={resetQuiz}>Retry</button>
                </div>
            ) : (
                <div>
                    <h3>{currentQuestion.question}</h3>
                    <div>
                        {currentQuestion.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => handleAnswer(index)}>
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
