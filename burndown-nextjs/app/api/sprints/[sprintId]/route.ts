import { NextRequest, NextResponse } from "next/server";
import { jiraService } from "@/lib/services/jira";

export async function GET(req: NextRequest, props: { params: Promise<{ sprintId: string }> }) {
    const params = await props.params;
    const { sprintId } = params;
    const id = parseInt(sprintId);

    const sprint = await jiraService.getSprint(id);

    return NextResponse.json(sprint);
}