export type SprintIssues = {
    issues: Issue[];
}

export type Issue = {
    changelog: Changelog;
    fields: Fields;
}

type Changelog = {
    histories: ChangelogHistory[];
}

type ChangelogHistory = {
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

export enum IssueStatus {
    Abandoned = "Abandonné",
    ToDemonstrate = "A démontrer",
    Finished = "Terminé",
}

type Status = {
    name: string;
}