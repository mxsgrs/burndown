export type Sprint = {
    id: number;
    self: string;
    state: "active" | "closed" | "future";
    name: string;
    startDate: string;
    endDate: string;
    createdDate: string;
    originBoardId: number;
    goal: string;
};