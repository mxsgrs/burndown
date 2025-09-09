import { NextRequest, NextResponse } from "next/server";
import { jiraService } from "@/lib/services/jira";

export async function GET(req: NextRequest, props: { params: Promise<{ boardId: string }> }) {
    const params = await props.params;
    const { boardId } = params;
    const id = parseInt(boardId);

    const board = await jiraService.getBoard(id);

    return NextResponse.json(board);
}