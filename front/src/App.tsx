"use client"

import { FormEvent, useEffect, useState } from "react"
import { HighScore, Question } from "../../back/src/types"
import { checkAnswer, fetchQuestion, recordScore, startSession } from "./lib/helpers"

interface GameOverFormProps {
    resetQuiz: (evt: FormEvent) => Promise<void>;
    score: number;
    name: string;
    setName: React.Dispatch<string>;
}
function GameOverForm({ resetQuiz, score, name, setName }: GameOverFormProps) {
    return <form onSubmit={resetQuiz}>
        <h2>Game over! Your score: {score}</h2>
        <input type="text" placeholder="Enter your name" value={name} onChange={e => setName(e.target.value)} name="ag_name"></input>
        <button>Retry</button>
    </form>
}

function LeaderboardTable({ leaderboard }: { leaderboard: HighScore[] })  {
    if (!leaderboard.length) return <h2>Nothing yet!</h2>

    const leaderboardRows = leaderboard.map(({ score, name }, index) =>
        <tr key={index}>
            <td align="center">{index + 1}</td>
            <td>{name}</td>
            <td align="center">{score}</td>
        </tr>
    )

    return <table align="center">
        <thead><tr>
            <td>🏆</td>
            <td>Name</td>
            <td align="center">Score</td>
        </tr></thead>
        <tbody>
            {leaderboardRows}
        </tbody>
    </table>
}

export default function QuizApp() {
    const [session, setSession] = useState<string | undefined>()
    const [currentQuestion, setCurrentQuestion] = useState<Question | undefined>()
    const [score, setScore] = useState(0)
    const [gameOver, setGameOver] = useState(false)
    const [name, setName] = useState<string>("")
    const [leaderboard, setLeaderboard] = useState<HighScore[]>([])
    const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false)
    const [disableAnswering, setDisableAnswering] = useState(false)
    
    useEffect(() => {
        startSession().then(({ id }) => {
            setSession(id)
            getNextQuestion(id)
        })
    }, [])

    const getNextQuestion = async (session: string) => {
        setCurrentQuestion(await fetchQuestion(session))
        setDisableAnswering(false)
    }

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
        const name = formData.get("ag_name") as string // formData can be a blob if it's a file input, but that's not the case here
        await recordScore(session!, name)

        const { id } = await startSession()
        setSession(id)
        setScore(0)
        setGameOver(false)
        setCurrentQuestion(undefined)
        getNextQuestion(id)
    }

    async function openLeaderboard () {
        const leaderboard = (await fetch("/api/leaderboard").then(r => r.json())) as HighScore[]
        setLeaderboard(leaderboard)
        setShowLeaderboard(true)
    }

    if (currentQuestion === undefined) return <div style={{ textAlign: 'center' }}>Loading...</div>

    if (showLeaderboard) {
        return <div>
            <h2>Leaderboard</h2>
            <LeaderboardTable leaderboard={leaderboard}/>
            <br />
            <button onClick={() => setShowLeaderboard(false)}>Close</button>
        </div>
    }

    const title = <h2>Anteater GPA Guesser</h2>
    if (gameOver) {
        const formProps = { resetQuiz, name, score, setName }
        return <div>{title}<hr/><GameOverForm {...formProps}/></div>
    }

    return <div>
        {title}
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

        <button onClick={openLeaderboard}>Leaderboard</button>
    </div>
}
