"use client"

import { useEffect, useState, useRef } from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { BurndownData } from "@/lib/types/burndown"
import { Sprint } from "@/lib/types/sprint"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { on } from "events"

const chartConfig = {
  remaining: {
    label: "Actuel",
  },
  remainingAim: {
    label: "Objectif",
  },
  runningTotal: {
    label: "Total",
  },
} satisfies ChartConfig

export function BurndownChart({ sprintId, onLoaded }: { sprintId: number, onLoaded: () => void }) {
  const [data, setData] = useState<BurndownData[]>();
  const [sprint, setSprint] = useState<Sprint>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dataResponse = await fetch(`/api/sprints/${sprintId}/burndown`)
        const fetchedData: BurndownData[] = await dataResponse.json()
        setData(fetchedData)

        const sprintResponse = await fetch(`/api/sprints/${sprintId}`)
        const fetchedSprint: Sprint = await sprintResponse.json()
        setSprint(fetchedSprint)

        onLoaded();
      } catch (err) {
        console.error("Failed to fetch burndown data", err)
      }
    }

    fetchData()
  }, [sprintId, onLoaded])

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>{global ? `Burndown ${sprint?.name}` : "Burndown sprint"}</CardTitle>
        <CardDescription className="max-w-[60%]">
          {sprint?.goal}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Area
              dataKey="remaining"
              type="linear"
              fill="#2892D7"
              stroke="#2892D7"
              strokeWidth={2}
              fillOpacity={.8}
            />
            <Area
              dataKey="remainingAim"
              type="linear"
              fill="#86c2ecff"
              stroke="#b6d9f3ff"
              strokeWidth={2}
              fillOpacity={.2}
            />
            <Area
              dataKey="runningTotal"
              type="linear"
              fill="#398dc2ff"
              stroke="#1D70A2"
              strokeWidth={2}
              fillOpacity={.05}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
