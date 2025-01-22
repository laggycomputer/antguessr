import createClient from "openapi-fetch";
import { SavedOffering } from "./types";
import { paths } from "./anteaterapi";

const headers = process.env.ANTEATER_API_TOKEN ? { Authorization: `Bearer ${process.env.ANTEATER_API_TOKEN}` } : undefined
export const openAPIClient = createClient<paths>({
    baseUrl: process.env.ANTEATER_API_ENDPOINT || "https://anteaterapi.com",
    headers,
})

export function shuffle<T>(arr: T[]) {
    // (as discovered later) this is actually just `return arr.sort(() => Math.random() < 0.5 ? -1 : 1)`

    let m = arr.length
    while (m) {
        const i = Math.floor(Math.random() * m--);
        [arr[m], arr[i]] = [arr[i]!, arr[m]!]
    }
    return arr
}

export function makeQuestionID(department: string, courseNumber: string, year: string) {
    return `${department}-${courseNumber}-${year}`
}

export function randRange(lower: number, upper: number) {
    return Math.random() * (upper - lower) + lower
}

export function transformGPA(gpa: number, correct = false) {
    let ret = Math.round(gpa * 10) / 10
    while (digitSum(ret) % 2 !== (correct ? 0 : 1)) {
        ret -= 0.1
        ret = Math.round(ret * 10) / 10
    }

    return Math.max(ret, 0)
}

export function digitSum(n: number) {
    return Array.from(Math.abs(n).toString().replace(".", "")).map(d => parseInt(d)).reduce((a, x) => a + x, 0)
}

export const gpaBuckets: [number, number][] = [
    [0, 2],
    [2, 2.5],
    [2.5, 3],
    [3, 3.25],
    [3.25, 3.5],
    [3.5, 4]
]

export function createOptionsFromGPA(data: Exclude<SavedOffering[1], undefined>) {
    const average = data.averageGPA!
    const buckets = gpaBuckets.slice()

    const correctBucket = buckets.findIndex(([lower, upper]) => lower < average && average <= upper)
    buckets.splice(correctBucket, 1)

    const bucketToRandomGPA = ([lower, upper]: number[]) => transformGPA(randRange(lower!, upper!), false)
    const initialOptions = [
        ...buckets.map(bucketToRandomGPA),
        data.averageGPA // previously transformed
    ]

    return [...new Set(initialOptions)].toSorted()
}
