import { NextRequest, NextResponse } from "next/server"

function getDateRange(start: string, end: string): string[] {
    const dates: string[] = []
    const current = new Date(start)
    const last = new Date(end)
    last.setDate(last.getDate() + 1)

    while (current <= last) {
        dates.push(current.toISOString().split("T")[0]) // YYYY-MM-DD
        current.setDate(current.getDate() + 1)
    }

    return dates
}

export async function GET(req: NextRequest) {

    // Sprint identifier
    const { searchParams } = new URL(req.url)
    const sprintId = searchParams.get("sprintId")

    // API authentication
    const JIRA_BASE = process.env.JIRA_BASE_URL
    const JIRA_EMAIL = process.env.JIRA_EMAIL
    const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN
    const token = `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")}`;

    // Fetch sprint information
    const sprintRes = await fetch(`${JIRA_BASE}/rest/agile/1.0/sprint/${sprintId}`, {
        headers: { Authorization: token, "Content-Type": "application/json" },
    })
    const sprint = await sprintRes.json()
    const sprintStart = sprint.startDate?.split("T")[0]
    const sprintEnd = sprint.endDate?.split("T")[0]

    if (!sprintStart || !sprintEnd) {
        return NextResponse.json({ error: "Sprint dates missing" }, { status: 500 })
    }

    // Fetch issues
    const r = await fetch(`${JIRA_BASE}/rest/agile/1.0/sprint/${sprintId}/issue?expand=changelog&maxResults=1000`, {
        headers: {
            Authorization: token,
            "Content-Type": "application/json",
        },
    })

    const data = await r.json()

    // Aggregate issues done per day
    const doneDates: string[] = []
    data.issues.forEach((issue: any) => {

        // Filter out abandoned tickets
        const latestStatus = issue.fields?.status?.name || ""
        if (latestStatus.toLowerCase() === "abandonné") return

        issue.changelog?.histories?.forEach((history: any) => {
            history.items.forEach((item: any) => {
                if (item.field === "status" && item.toString === "A démontrer") {
                    doneDates.push(history.created.split("T")[0])
                }
            })
        })
    })

    // Count per day
    const countMap: Record<string, number> = {}
    doneDates.forEach((date) => {
        countMap[date] = (countMap[date] || 0) + 1
    })

    // Creation per day
    const creationMap: Record<string, number> = {}
    data.issues.forEach((issue: any) => {
        const status = (issue.fields?.status?.name || "").toLowerCase()
        if (status === "abandonné") return
        if (!issue.fields?.created) return

        const createdDate = issue.fields.created.split("T")[0]
        creationMap[createdDate] = (creationMap[createdDate] || 0) + 1
    })

    // Calculate initial total from issues created before sprint start (no type filtering)
    let runningTotal = data.issues.reduce((sum: any, issue: any) => {
        const status = (issue.fields?.status?.name || "").toLowerCase()
        if (status === "abandonné") return sum
        const createdDate = issue.fields.created.split("T")[0]
        return createdDate < sprintStart ? sum + 1 : sum
    }, 0)

    // Build cumulative dataset including issues created before sprint (no type filtering)

    const sprintDays = getDateRange(sprintStart, sprintEnd)
        .filter((date) => {
            const day = new Date(date).getDay()
            return day !== 0 && day !== 6
        });

    let runningDone = 0

    // Build result
    const result = sprintDays.map((date, index) => {
        runningDone += countMap[date] || 0

        data.issues.forEach((issue: any) => {
            const status = (issue.fields?.status?.name || "").toLowerCase()
            if (status === "abandonné") return

            const createdDate = issue.fields.created.split("T")[0]
            if (createdDate === date) runningTotal += 1
        })

        const aimDone = parseFloat(((index / (sprintDays.length - 1)) * runningTotal).toFixed(1))
        const remaining = runningTotal - runningDone;
        const remainingAim = parseFloat((runningTotal - aimDone).toFixed(1));

        return { date, remaining: remaining, remainingAim: remainingAim, total: runningTotal }
    })

    const response = { sprint, data: result }

    return NextResponse.json(response)
}
