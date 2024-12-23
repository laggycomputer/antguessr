import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

import "dotenv/config"
import express from "express"
import createClient from "openapi-fetch"
import { v4 as uuidv4 } from "uuid"

import type { paths } from "./anteaterapi"
import { courses, years } from "./course-pool"
import { AnswerResponse, Question, StartGameResponse } from "./types"
import { shuffle } from "./util"
const app = express()

const headers = process.env["ANTEATER_API_TOKEN"] ? { Authorization: `Bearer ${process.env["ANTEATER_API_TOKEN"]}` } : undefined
const client = createClient<paths>({
    baseUrl: process.env.ANTEATER_API_ENDPOINT || "https://anteaterapi.com",
    headers,
})

const sessions = Object.create(null) as Record<string, {
    state: "nextQuestion" | { answering: string } | "enterName"
    score: number
}>

type GradeData = paths["/v2/rest/grades/aggregateByCourse"]["get"]["responses"]["200"]["content"]["application/json"]["data"][0]
type SavedOffering = [[string, string, string], GradeData | undefined]
const offerings = shuffle(courses.map(c => years.map(y => [[...c, y], undefined] as SavedOffering)).flat())

function makeQuestionID(department: string, courseNumber: string, year: string) {
    return `${department}-${courseNumber}-${year}`
}

function transformGPA(gpa: number) {
    return Math.round(gpa * 10) / 10
}

// app.use((_req, res, next) => {
//     res.header("Access-Control-Allow-Origin", "*")
//     res.header("Access-Control-Allow-Headers", "*")
//     next()
// })

app.set("trust proxy", 1)

app.get("/api/hi", (_req, res) => {
    res.send("hi")
})

app.use("/", express.static(path.join(__dirname, "front", "dist")))

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
            data.averageGPA = transformGPA(data.averageGPA as number)
        }
        offering[1] = data
        offerings.unshift(offering)
    }

    const questionId = makeQuestionID(data.department, data.courseNumber, (year as string).toString())
    sessions[session].state = { answering: questionId }

    // TODO
    return res.json({
        id: questionId,
        options: [0, 1, 2, data.averageGPA],
    } as Question)
})

app.post("/api/privileged/answer", (req, res) => {
    const session = req.headers["authorization"] as string
    if (typeof sessions[session]?.state !== "object" || !("answering" in (sessions[session].state))) {
        return res.status(401).send("ask for a question first!")
    }

    // todo: check answer, manage score and session
    const question = offerings.find(([[dept, courseNum, year]]) =>
        makeQuestionID(dept, courseNum, year.toString()) == (sessions[session]?.state as { answering: string }).answering) as SavedOffering
    const correct = question[1]?.averageGPA == req.body
    return res.json({ correct } as AnswerResponse)
})

const port = process.env["PORT"] || 3939
app.listen(port, async () => {
    console.log(`Ready at port ${port}`)
})
