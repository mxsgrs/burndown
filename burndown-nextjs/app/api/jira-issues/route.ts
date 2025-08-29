// app/api/jira-issues/route.ts
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const sprintId = searchParams.get("sprintId")

    const JIRA_BASE = process.env.JIRA_BASE_URL
    const JIRA_EMAIL = process.env.JIRA_EMAIL
    const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN

    const token = `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")}`;

    const url = `${JIRA_BASE}/rest/agile/1.0/sprint/${sprintId}/issue?expand=changelog&maxResults=1000`;

    const r = await fetch(url, {
        headers: {
            Authorization: token,
            "Content-Type": "application/json",
        },
    })

    const data = await r.json()
    return NextResponse.json("ok")
}
