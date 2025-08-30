import { NextRequest, NextResponse } from "next/server";
import { jiraService } from "@/lib/services/jira";

export async function GET(req: NextRequest, props: { params: Promise<{ sprintId: number }> }) {
    const params = await props.params;
    const { sprintId } = params;

    const sprint = await jiraService.getSprint(sprintId);

    return NextResponse.json(sprint);
}