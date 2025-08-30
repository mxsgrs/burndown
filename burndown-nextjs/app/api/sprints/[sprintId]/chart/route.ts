import { NextRequest, NextResponse } from "next/server";
import { SprintIssues, Issue, IssueStatus } from "@/types/sprint-issues";
import { Sprint } from "@/types/sprint";
import { BurndownGlobal, BurndownData } from "@/types/burndown"

// Get all working days between start and end
function getSprintDays(sprint: Sprint): string[] {
    const dates: string[] = [];
    const current = new Date(sprint.startDate);
    const last = new Date(sprint.endDate);
    last.setDate(last.getDate() + 1);

    while (current <= last) {
        dates.push(current.toISOString().split("T")[0]);
        current.setDate(current.getDate() + 1);
    }

    // Filter out week-end days
    return dates.filter((date) => {
        const day = new Date(date).getDay();
        return day !== 0 && day !== 6;
    });
}

// Fetch sprint data from Jira
async function fetchSprint(sprintId: string, token: string): Promise<Sprint> {
    const baseUrl = process.env.JIRA_BASE_URL;
    const res = await fetch(`${baseUrl}/rest/agile/1.0/sprint/${sprintId}`, {
        headers: { Authorization: token, "Content-Type": "application/json" },
    });
    return res.json();
}

// Fetch sprint issues from Jira
async function fetchSprintIssues(sprintId: string, token: string): Promise<SprintIssues> {
    const baseUrl = process.env.JIRA_BASE_URL;
    const res = await fetch(
        `${baseUrl}/rest/agile/1.0/sprint/${sprintId}/issue?expand=changelog&maxResults=1000`,
        { headers: { Authorization: token, "Content-Type": "application/json" } }
    );
    return res.json();
}

// Extract done dates from issues
function getDoneDates(issues: Issue[]): string[] {
    const doneDates: string[] = [];

    issues.forEach((issue) => {
        const latestStatus = issue.fields?.status?.name || "";
        if (latestStatus === IssueStatus.Abandoned) return;

        issue.changelog?.histories?.forEach((history) => {
            history.items.forEach((item) => {
                if (item.field === "status" && item.toString === IssueStatus.Done) {
                    doneDates.push(history.created.split("T")[0]);
                }
            });
        });
    });

    return doneDates;
}

// Count occurrences per day
function getCountMap(dates: string[]): Record<string, number> {
    const map: Record<string, number> = {};
    dates.forEach((date) => (map[date] = (map[date] || 0) + 1));
    return map;
}

// Count occurrences per day
function getToken(): string {
    const JIRA_EMAIL = process.env.JIRA_EMAIL!;
    const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN!;
    return `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")}`;
}

// Calculate running total of issues before sprint start
function getRunningTotal(issues: Issue[], sprintStart: string): number {
    return issues.reduce((sum, issue) => {
        const status = issue.fields?.status?.name || "";
        if (status === IssueStatus.Abandoned) return sum;

        const createdDate = issue.fields.created.split("T")[0];
        return createdDate < sprintStart ? sum + 1 : sum;
    }, 0);
}

// Build burndown data
function buildBurndown(
    sprint: Sprint,
    issues: Issue[],
    countMap: Record<string, number>
): BurndownGlobal {
    const sprintDays = getSprintDays(sprint);
    let runningTotal = getRunningTotal(issues, sprint.startDate);
    let runningDone = 0;

    const burndown: BurndownData[] = sprintDays.map((date, index) => {
        runningDone += countMap[date] || 0;

        issues.forEach((issue) => {
            const status = issue.fields?.status?.name || "";
            if (status === IssueStatus.Abandoned) return;

            const createdDate = issue.fields.created.split("T")[0];
            if (createdDate === date) runningTotal += 1;
        });

        const aimDone = parseFloat(((index / (sprintDays.length - 1)) * runningTotal).toFixed(1));
        const remaining = runningTotal - runningDone;
        const remainingAim = parseFloat((runningTotal - aimDone).toFixed(1));

        return { date, remaining, remainingAim, runningTotal };
    });

    return { burndown, sprint } as BurndownGlobal;
}

// Endpoint
export async function GET(
    req: NextRequest,
    { params }: { params: { sprintId: string } }
) {
    const { sprintId } = params;

    const token = getToken();
    const sprint = await fetchSprint(sprintId, token);
    const sprintIssues = await fetchSprintIssues(sprintId, token);
    const doneDates = getDoneDates(sprintIssues.issues);
    const countMap = getCountMap(doneDates);
    const burndown = buildBurndown(sprint, sprintIssues.issues, countMap);

    return NextResponse.json(burndown);
}
