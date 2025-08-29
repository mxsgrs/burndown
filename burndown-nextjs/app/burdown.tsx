"use client"

import { useEffect, useState } from "react"
import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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

export const description = "An area chart with a legend"

type BurndownData = {
  date: string;
  remaining: number;
  remainingAim: number;
  total: number;
};

const chartConfig = {
  remaining: {
    label: "Actuel",
  },
  remainingAim: {
    label: "Objectif",
  },
  total: {
    label: "Total",
  },
} satisfies ChartConfig

export function Burndown({ sprintId }: { sprintId: string }) {

  const [chartData, setChartData] = useState<BurndownData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/jira-issues?sprintId=${sprintId}`)
        const issues: BurndownData[] = await res.json()

        setChartData(issues)
      } catch (err) {
        console.error("Failed to fetch burndown data", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [sprintId])

  if (loading) return <p>Loading burndown...</p>

  return (
    <Card className="gap-0">
      <CardHeader>
        <CardTitle>Burndown sprint v1.4</CardTitle>
        <CardDescription>
          Avancement des développements dans Back Office
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={chartData}
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
            // tickFormatter={(value) => value.slice(0, 3)}
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
              dataKey="total"
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
