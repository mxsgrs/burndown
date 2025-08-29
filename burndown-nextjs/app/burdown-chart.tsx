"use client"

import { useEffect, useState } from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { BurndownGlobal } from "@/types/burndown"

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

export function BurndownChart({ sprintId }: { sprintId: string }) {
  const [global, setGlobal] = useState<BurndownGlobal>();
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/chart?sprintId=${sprintId}`)
        const global: BurndownGlobal = await res.json()

        setGlobal(global)
      } catch (err) {
        console.error("Failed to fetch burndown data", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [sprintId])

  if (loading) return null

  return (
    <Card className="gap-0">
      <CardHeader>
        <CardTitle>{global ? `Burndown ${global.sprint.name}` : "Burndown sprint"}</CardTitle>
        <CardDescription className="max-w-[60%]">
          {global ? global.sprint.goal : "Avancement des développements dans Back Office"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={global?.burndown}
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
              dataKey="remainingAim"
              type="linear"
              fillOpacity={0.4}
            />
            <Area
              dataKey="remaining"
              type="linear"
              fillOpacity={0.4}
            />
            <Area
              dataKey="runningTotal"
              type="linear"
              fillOpacity={0.1}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
