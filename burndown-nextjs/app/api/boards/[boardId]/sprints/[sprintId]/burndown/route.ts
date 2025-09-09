import { NextRequest, NextResponse } from "next/server";
import { Issue, IssueStatus } from "@/lib/types/sprint-issues";
import { Sprint } from "@/lib/types/sprint";
import { BurndownData } from "@/lib/types/burndown"
import { jiraService } from '@/lib/services/jira'

// Get all working days between start and end
function getSprintDays(sprint: Sprint): string[] {
    const dates: string[] = [];
    const current = new Date(sprint.startDate.split("T")[0]);
    const last = new Date(sprint.endDate.split("T")[0]);
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

// Extract done dates from issues
function getDoneDates(issues: Issue[]): string[] {
    const doneDates: string[] = [];

    issues.forEach((issue) => {
        const latestStatus = issue.fields?.status?.name || "";
        if (latestStatus === IssueStatus.Abandoned) return;

        let lastDoneDate: string | null = null;

        issue.changelog?.histories?.forEach((history) => {
            history.items.forEach((item) => {
                if (item.field === "status" && item.toString === IssueStatus.Done) {
                    lastDoneDate = history.created.split("T")[0];
                }
            });
        });

        if (lastDoneDate) {
            doneDates.push(lastDoneDate);
        }
    });

    return doneDates;
}

// Count occurrences per day
function getCountMap(dates: string[]): Record<string, number> {
    const map: Record<string, number> = {};
    dates.forEach((date) => (map[date] = (map[date] || 0) + 1));
    return map;
}

// Calculate running total of issues before sprint start
function getRunningTotal(issues: Issue[], sprintStart: string): number {
    return issues.reduce((sum, issue) => {
        const status = issue.fields?.status?.name || "";
        if (status === IssueStatus.Abandoned || status == "") return sum;

        const createdDate = issue.fields.created.split("T")[0];
        return createdDate < sprintStart ? sum + 1 : sum;
    }, 0);
}

// Build burndown data
function buildBurndown(
    sprint: Sprint,
    issues: Issue[],
    countMap: Record<string, number>
): BurndownData[] {
    const sprintDays = getSprintDays(sprint);
    let runningTotal = getRunningTotal(issues, sprintDays[0]);
    let runningDone = 0;

    return sprintDays.map((date, index) => {
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
}

export async function GET(req: NextRequest, props: { params: Promise<{ sprintId: string }> }) {
    const params = await props.params;
    const { sprintId } = params;
    const id = parseInt(sprintId);

    const sprint = await jiraService.getSprint(id);
    const sprintIssues = await jiraService.getSprintIssues(id);
    const doneDates = getDoneDates(sprintIssues.issues);
    const countMap = getCountMap(doneDates);
    const burndown = buildBurndown(sprint, sprintIssues.issues, countMap);

    return NextResponse.json(burndown);
}
