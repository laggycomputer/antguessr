import process from "node:process"

import "dotenv/config"
import express from "express"
import createClient from "openapi-fetch"
import { v4 as uuidv4 } from "uuid"

import mongoose, { Schema } from "mongoose"
import type { paths } from "./anteaterapi"
import { courses, years } from "./course-pool"
import { AnswerResponse, Question, StartGameResponse } from "./types"
import { makeQuestionID, randRange, shuffle, transformGPA } from "./util"
const app = express()

const headers = process.env.ANTEATER_API_TOKEN ? { Authorization: `Bearer ${process.env.ANTEATER_API_TOKEN}` } : undefined
const client = createClient<paths>({
    baseUrl: process.env.ANTEATER_API_ENDPOINT || "https://anteaterapi.com",
    headers,
})

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

type GradeData = paths["/v2/rest/grades/aggregateByCourse"]["get"]["responses"]["200"]["content"]["application/json"]["data"][0]
type SavedOffering = [[string, string, string], GradeData | undefined]
const offerings = shuffle(courses.map(c => years.map(y => [[...c, y], undefined] as SavedOffering)).flat())


// app.use((_req, res, next) => {
//     res.header("Access-Control-Allow-Origin", "*")
//     res.header("Access-Control-Allow-Headers", "*")
//     next()
// })

app.set("trust proxy", 1)

app.get("/api/hi", (_req, res) => {
    res.send("hi")
})

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
    if (!("authorization" in req.headers)) {
        return res.status(401).send("get a session kid")
    }

    const tok = (req.headers?.["authorization"] ?? "").replace("Bearer ", "")
    if (!(tok in sessions)) {
        return res.status(401).send("bad session")
    }

    req.headers["authorization"] = tok

    return next()
})

app.get("/api/privileged/question", async (req, res) => {
    const session = req.headers["authorization"] as string
    if (sessions[session]?.state !== "nextQuestion") {
        return res.status(401).send("answer your question first!")
    }

    let data
    let year
    while (!data) {
        const offering = offerings.pop() as SavedOffering
        let [[department, courseNumber], existingData] = offering
        year = offering[0][2]
        data = existingData ?? await client.GET("/v2/rest/grades/aggregateByCourse", {
            params: {
                query: {
                    department,
                    courseNumber,
                    year,
                },
            },
        }).then(r => r.data?.data[0]) as GradeData
        if (data && "averageGPA" in data) {
            data.averageGPA = transformGPA(data.averageGPA as number, true)
        }
        offering[1] = data
        offerings.unshift(offering)
    }

    const questionId = makeQuestionID(data.department, data.courseNumber, (year as string).toString())
    sessions[session].state = { answering: questionId }

    const buckets = [
        [0, 2],
        [2, 2.5],
        [2.5, 3],
        [3, 3.25],
        [3.25, 3.5],
        [3.5, 4],
    ] as [number, number][]

    const bucket = buckets.findIndex(([lower, upper]) => lower < data.averageGPA && data.averageGPA <= upper)
    buckets.splice(bucket, 1)
    const options = Array.from(new Set([
        ...buckets.map(([lower, upper]) => transformGPA(randRange(lower, upper), false)),
        data.averageGPA,
    ].toSorted()))

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
    if (correct) {
        sessions[session].score += 1
        sessions[session].state = "nextQuestion"
        return res.json({
            correct,
            score: sessions[session].score,
        } as AnswerResponse)
    } else {
        sessions[session].state = "enterName"
        return res.json({
            correct,
            actual: question[1]?.averageGPA,
            score: sessions[session].score,
        } as AnswerResponse)
    }
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
        
        if (insertAt === -1) highScores.leaderboard.push({ name, score });
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
