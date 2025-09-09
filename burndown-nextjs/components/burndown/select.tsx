'use client'

import { BurndownChart } from "@/components/burndown/chart"
import { SprintList } from "@/lib/types/sprint"
import { useEffect, useState } from "react"
import { Board } from "@/lib/types/board"

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export default function BurndownSelect({ boardId }: { boardId: number }) {
    const [sprintList, setSprintList] = useState<SprintList>();
    const [selectedSprintId, setSelectedSprintId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [board, setBoard] = useState<Board>();

    const handleChartLoaded = () => {
        setLoading(false);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const boardResponse = await fetch(`/api/boards/${boardId}`)
                const boardData: Board = await boardResponse.json()
                setBoard(boardData)

                const sprintListResponse = await fetch(`/api/boards/${boardId}/sprints`)
                const sprintListData: SprintList = await sprintListResponse.json()
                setSprintList(sprintListData)

                // Find first 'active' sprint
                // or last completed sprint
                let defaultSprintId: number | null = null;
                if (sprintListData?.values?.length) {
                    const activeSprint = sprintListData.values.find(sprint => sprint.state === 'active');
                    if (activeSprint) {
                        defaultSprintId = activeSprint.id;
                    } else {
                        const completedSprints = sprintListData.values
                            .filter(sprint => sprint.state === 'closed')
                            .sort((a, b) => new Date(b.completeDate).getTime() - new Date(a.completeDate).getTime());
                        if (completedSprints.length > 0) {
                            defaultSprintId = completedSprints[0].id;
                        }
                    }
                }
                setSelectedSprintId(defaultSprintId);
            } catch (err) {
                console.error("Failed to fetch sprint list", err)
            }
        }

        fetchData()
    }, [])

    return (
        <div className="space-y-4" style={{ visibility: loading ? "hidden" : "visible" }}>
            <h1 className="text-3xl font-semibold leading-none tracking-tight px-3 mb-9">{board?.location.displayName}</h1>
            <Select
                value={selectedSprintId !== null ? selectedSprintId.toString() : undefined}
                onValueChange={(value) => setSelectedSprintId(Number(value))}
            >
                <SelectTrigger
                    className="w-[180px] ml-auto mr-3 focus-visible:ring-transparent focus-visible:border-[var(--input)]"
                >
                    <SelectValue placeholder="Select a sprint" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>Sprints</SelectLabel>
                        {sprintList?.values
                            ?.filter(sprint => sprint.state !== 'future')
                            .slice()
                            .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
                            .map((sprint) => (
                                <SelectItem key={sprint.id} value={sprint.id.toString()}>
                                    {sprint.name}
                                </SelectItem>
                            ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
            {selectedSprintId &&
                <BurndownChart boardId={boardId} sprintId={selectedSprintId} onLoaded={handleChartLoaded} />
            }
        </div>
    );
}