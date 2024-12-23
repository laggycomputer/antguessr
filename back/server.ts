import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

import "dotenv/config"
import express from "express"
const app = express()
app.locals = {}

app.use((_req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "*")
    next()
})

app.set("trust proxy", 1)

app.get("/api/hi", function (_req, res) {
    res.send("hi")
})
app.use("/", express.static(path.join(__dirname, "front", "dist")))

const port = process.env["PORT"] || 3939
app.listen(port, async () => {
    console.log(`Ready at port ${port}`)
})
