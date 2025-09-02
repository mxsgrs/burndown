import { NextRequest, NextResponse } from "next/server";
import { jiraService } from "@/lib/services/jira";

export async function GET(req: NextRequest) {
    const sprint = await jiraService.getSprintList(12);

    return NextResponse.json(sprint);
}