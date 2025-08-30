export type SprintList = {
    maxResults: number;
    startAt: number;
    total: number;
    isLast: boolean;
    values: Sprint[];
}

export type Sprint = {
    id: number;
    self: string;
    state: "active" | "closed" | "future";
    name: string;
    startDate: string;
    endDate: string;
    createdDate: string;
    completeDate: string;
    originBoardId: number;
    goal: string;
};