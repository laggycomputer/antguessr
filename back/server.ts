import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

import "dotenv/config"
import express from "express"
import { v4 as uuidv4 } from "uuid"
import { StartGameResponse } from "./types.js"
const app = express()

const sessions = Object.create(null) as Record<string, {
    state: "nextQuestion" | { answering: string } | "enterName"
    score: number
}>

// app.use((_req, res, next) => {
//     res.header("Access-Control-Allow-Origin", "*")
//     res.header("Access-Control-Allow-Headers", "*")
//     next()
// })

app.set("trust proxy", 1)

app.get("/api/hi", function (_req, res) {
    res.send("hi")
})

app.use("/", express.static(path.join(__dirname, "front", "dist")))

app.post("/api/start-game", function (_req, res) {
    const sessId = uuidv4()
    sessions[sessId] = { state: "nextQuestion", score: 0 }
    res.status(200).json({ id: sessId } as StartGameResponse)
})

const port = process.env["PORT"] || 3939
app.listen(port, async () => {
    console.log(`Ready at port ${port}`)
})
