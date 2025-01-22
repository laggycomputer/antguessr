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
