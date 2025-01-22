import process from "node:process"

import "dotenv/config"
import express from "express"
import { v4 as uuidv4 } from "uuid"

import mongoose, { Schema } from "mongoose"
import { AnswerResponse, HighScore, Question, SavedOffering, StartGameResponse } from "./types"
import { createOptionsFromGPA, makeQuestionID } from "./util"
import { getNextOfferingGPA, getRandomizedOfferings } from "./course"
const app = express()

await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1/antguessr")
const leaderboardModel = mongoose.model("antguessr", new Schema({
    leaderboard: [{
        name: String,
        score: Number,
    }],
}), "antguessr")

if (await leaderboardModel.findOne({}) == null) {
    const emptyEntry = { leaderboard: [] }
    await leaderboardModel.insertMany([emptyEntry])
}

interface QuizSession {
    state: "nextQuestion" | { answering: string } | "enterName"
    score: number
}

const sessions: Record<string, QuizSession> = {}
const offerings = getRandomizedOfferings()

app.use(express.json())

// serve frontend's build folder in prod env (not idiotic hackathon decision)
app.use("/", express.static("../front/dist"))

app.post("/api/start-game", (_req, res) => {
    const sessId = uuidv4()
    sessions[sessId] = { state: "nextQuestion", score: 0 }
    // yeet in 2 hours (this is dumb)
    setTimeout(() => delete sessions[sessId], 1000 * 60 * 60 * 2)
    res.status(200).json({ id: sessId } as StartGameResponse)
})

app.use("/api/privileged/*", (req, res, next) => {
    // Missing auth header
    if (!("authorization" in req.headers)) return res.status(401).send("get a session kid")

    // Token exists but is invalid
    const tok = (req.headers?.["authorization"] ?? "").replace("Bearer ", "")
    if (!(tok in sessions)) return res.status(401).send("bad session")

    req.headers["authorization"] = tok
    return next()
})

app.get("/api/privileged/question", async (req, res) => {
    const session = req.headers["authorization"] as string
    if (sessions[session]?.state !== "nextQuestion") return res.status(401).send("answer your question first!")

    const { data, year } = await getNextOfferingGPA(offerings)

    const questionId = makeQuestionID(data.department, data.courseNumber, (year as string).toString())
    sessions[session].state = { answering: questionId }

    const options = createOptionsFromGPA(data)

    return res.json({
        id: questionId,
        options,
        question: `${data.department} ${data.courseNumber}, ${year}`,
    } as Question)
})

app.post("/api/privileged/answer", (req, res) => {
    const session = req.headers["authorization"] as string
    if (typeof sessions[session]?.state !== "object" || !("answering" in (sessions[session].state))) {
        return res.status(401).send("ask for a question first!")
    }

    const question = offerings.find(([[dept, courseNum, year]]) =>
        makeQuestionID(dept, courseNum, year.toString()) == (sessions[session]?.state as { answering: string }).answering) as SavedOffering
    const correct = question[1]?.averageGPA?.toString() == req.body?.answer
    let response: AnswerResponse
    if (correct) {
        sessions[session].score += 1
        sessions[session].state = "nextQuestion"
        response = { correct, score: sessions[session].score }
    } else {
        sessions[session].state = "enterName"
        response = {
            correct,
            actual: question[1]?.averageGPA!,
            score: sessions[session].score,
        }
    }
    return res.json(response)
})

app.post("/api/privileged/save-score", async (req, res) => {
    const session = req.headers["authorization"] as string
    if (sessions[session]?.state !== "enterName") {
        return res.status(401).send("game isn't over! keep playing!")
    }

    const score = Math.floor(sessions[session]?.score ?? 0)
    delete sessions[session]
    const name = (req.body?.name || "").toString().trim() as string

    if (score > 0 && name) {
        const highScores = (await leaderboardModel.findOne({}))!

        const insertAt = highScores.leaderboard.findIndex(({ score: lbScore }) => lbScore! < score)
        if (insertAt === -1) highScores.leaderboard.push({ name, score })
        else highScores.leaderboard.splice(insertAt, 0, { name, score })

        await leaderboardModel.updateOne({}, { $set: { leaderboard: highScores.leaderboard.slice(0, 50) } })
        return res.status(200).json({ ranking: insertAt + 1 + 1 })
    } else {
        return res.status(200).json({})
    }
})

app.get("/api/leaderboard", async (_req, res) => {
    const data = await leaderboardModel.findOne({})
    res.json(data?.leaderboard)
})

const port = process.env.PORT || 3939
app.listen(port, async () => {
    console.log(`Ready at port ${port}`)
})
