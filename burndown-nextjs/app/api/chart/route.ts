import { NextRequest, NextResponse } from "next/server"

// List the dates of working days inside a given period
function getSprintDays(start: string, end: string): string[] {
    const dates: string[] = []
    const current = new Date(start)
    const last = new Date(end)
    last.setDate(last.getDate() + 1)

    while (current <= last) {
        dates.push(current.toISOString().split("T")[0])
        current.setDate(current.getDate() + 1)
    }

    return dates.filter((date) => {
            const day = new Date(date).getDay()
            return day !== 0 && day !== 6
        });
}

export enum IssueStatus {
  Abandoned = "Abandonné",
  Done = "A démontrer"
}

type SprintIssues = {
    issues: Issue[];
}

type Issue = {
    changelog: Changelog;
    fields: Fields;
}

type Changelog = {
    histories: History[];
}

type History = {
    items: HistoryItem[];
    created: string;
}

type HistoryItem = {
    field: string;
    toString: string;
}

type Fields = {
    status: Status;
    created: string;
}

type Status = {
    name: string;
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

    const sprintIssues: SprintIssues = await r.json()

    // Find dates when issues were closed
    const doneDates: string[] = []
    sprintIssues.issues.forEach((issue: Issue) => {

        // Filter out abandoned tickets
        const latestStatus = issue.fields?.status?.name || ""
        if (latestStatus === IssueStatus.Abandoned) return

        issue.changelog?.histories?.forEach((history: History) => {
            history.items.forEach((item: HistoryItem) => {
                // Find the day when issue was closed
                if (item.field === "status" && item.toString === IssueStatus.Done) {
                    doneDates.push(history.created.split("T")[0])
                }
            })
        })
    })

    // Count closed issues per day
    const countMap: Record<string, number> = {}
    doneDates.forEach((date) => {
        countMap[date] = (countMap[date] || 0) + 1
    })

    // Creation per day
    const creationMap: Record<string, number> = {}
    sprintIssues.issues.forEach((issue: Issue) => {
        const status = issue.fields?.status?.name || ""
        if (status === IssueStatus.Abandoned) return
        if (!issue.fields?.created) return

        const createdDate = issue.fields.created.split("T")[0]
        creationMap[createdDate] = (creationMap[createdDate] || 0) + 1
    })

    // Calculate initial total from issues created before sprint start (no type filtering)
    let runningTotal = sprintIssues.issues.reduce((sum: number, issue: Issue) => {
        const status = issue.fields?.status?.name || ""
        if (status === IssueStatus.Abandoned) return sum

        const createdDate = issue.fields.created.split("T")[0]
        return createdDate < sprintStart ? sum + 1 : sum
    }, 0)

    const sprintDays = getSprintDays(sprintStart, sprintEnd);
    
    // Build result
    let runningDone = 0
    const burndown = sprintDays.map((date, index) => {
        runningDone += countMap[date] || 0

        sprintIssues.issues.forEach((issue: Issue) => {
            const status = issue.fields?.status?.name || ""
            if (status === IssueStatus.Abandoned) return

            const createdDate = issue.fields.created.split("T")[0]
            if (createdDate === date) runningTotal += 1
        })

        const aimDone = parseFloat(((index / (sprintDays.length - 1)) * runningTotal).toFixed(1))
        const remaining = runningTotal - runningDone;
        const remainingAim = parseFloat((runningTotal - aimDone).toFixed(1));

        return { 
            date, 
            remaining,
            remainingAim,
            runningTotal
        }
    })

    const response = { sprint, burndown }

    return NextResponse.json(response)
}
