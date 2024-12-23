import { courses, years } from "./course-pool"
import { GradeData, SavedOffering } from "./types"
import { openAPIClient, shuffle, transformGPA } from "./util"

export function getRandomizedOfferings() {
    // offerings: [[["STATS", "67", 2022], undefined], [["STATS", "67", 2023], undefined], ...]
    const offerings: SavedOffering[] = courses.flatMap(c => years.map(y => [[...c, y] as [string, string, string], undefined]))
    return shuffle(offerings)
}

export async function getCourseGradeData(department: string, courseNumber: string, year: string): Promise<GradeData> {
    const response = await openAPIClient.GET("/v2/rest/grades/aggregateByCourse", {
        params: {
            query: { department, courseNumber, year },
        },
    })
    return response.data?.data[0]!
}

export async function getNextOfferingGPA(offerings: SavedOffering[]) {
    let data, year
    while (!data) {
        const offering = offerings.pop() as SavedOffering
        let [[department, courseNumber, offeredYear], existingData] = offering
        year = offeredYear
        data = existingData ?? await getCourseGradeData(department, courseNumber, year)

        if (data && "averageGPA" in data) data.averageGPA = transformGPA(data.averageGPA as number, true)

        offering[1] = data
        offerings.unshift(offering)
    }
    return { data, year }
}
