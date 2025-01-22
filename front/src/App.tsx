"use client"

import { FormEvent, useEffect, useState } from "react"
import { HighScore, Question } from "../../back/src/types"
import { checkAnswer, fetchQuestion, recordScore, startSession } from "./lib/helpers"

export default function QuizApp() {
    const [session, setSession] = useState<string | undefined>()
    const [currentQuestion, setCurrentQuestion] = useState<Question | undefined>()
    const [score, setScore] = useState(0)
    const [gameOver, setGameOver] = useState(false)
    const [name, setName] = useState<string>("")
    const [leaderboard, setLeaderboard] = useState<HighScore[]>([])
    const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false)
    const [disableAnswering, setDisableAnswering] = useState(false)

    const getNextQuestion = async (session: string) => {
        setCurrentQuestion(await fetchQuestion(session))
        setDisableAnswering(false)
    }

    useEffect(() => {
        startSession().then(({ id }) => {
            setSession(id)
            getNextQuestion(id)
        })
    }, [])

    const handleAnswer = async (answer: number) => {
        setDisableAnswering(true)
        const { correct } = await checkAnswer(session!, answer)
        if (!correct) return setGameOver(true)

        setScore(score + 1)
        await getNextQuestion(session as string)
    }

    async function resetQuiz(evt: FormEvent) {
        evt.preventDefault();
        const formData = new FormData(evt.target as HTMLFormElement);
        const name = formData.get("name") as string // formData can be a blob if it's a file input, but that's not the case here
        await recordScore(session!, name)

        const { id } = await startSession()
        setSession(id)
        setScore(0)
        setGameOver(false)
        setCurrentQuestion(undefined)
        getNextQuestion(id)
    }

    if (currentQuestion === undefined) return <div>Loading...</div>

    if (showLeaderboard) {
        return (
            <div>
                <h1>Leaderboard</h1>
                {
                    leaderboard.length ? (
                        <table align="center">
                            <thead>
                                <tr>
                                    <td></td>
                                    <td align="center">Name</td>
                                    <td align="center">Score</td>
                                </tr>
                            </thead>
                            {leaderboard.map(({ score, name }, index) => <tr>
                                <td align="right">{index + 1}</td>
                                <td align="center">{name}</td>
                                <td align="center">{score}</td>
                            </tr>)}
                        </table>
                    ) : <h2>Nothing yet!</h2>
                }
                <button onClick={() => setShowLeaderboard(false)}>Close</button>
            </div>
        )
    }

    return (
        <div>
            <h2>Anteater GPA Guesser</h2>
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
                    <hr />
                    <h3>{currentQuestion.question}</h3>
                    <div className="answer-options">
                        {currentQuestion.options.map((option, index) => (
                            <button
                                key={index}
                                disabled={disableAnswering}
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
