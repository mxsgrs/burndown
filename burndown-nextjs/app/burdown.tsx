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
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

type Issue = {
  key: string
  changelog: {
    histories: {
      created: string
      items: { field: string; toString?: string }[]
    }[]
  }
}

type DonePerDay = {
  date: string
  done: number
}

const chartConfig = {
  done: {
    label: "Done",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function Burndown({ sprintId }: { sprintId: string }) {
  const [chartData, setChartData] = useState<DonePerDay[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/jira-issues?sprintId=${sprintId}`)
        const issues: Issue[] = await res.json()

        const doneDates: string[] = []

        issues.forEach((issue) => {
          issue.changelog.histories.forEach((history) => {
            history.items.forEach((item) => {
              if (item.field === "status" && item.toString === "Done") {
                doneDates.push(history.created.split("T")[0]) // YYYY-MM-DD
              }
            })
          })
        })

        // Count done per day
        const countMap: Record<string, number> = {}
        doneDates.forEach((date) => {
          countMap[date] = (countMap[date] || 0) + 1
        })

        // Sort & format for chart
        const sortedDays = Object.keys(countMap).sort()
        const result = sortedDays.map((date) => ({
          date,
          done: countMap[date],
        }))

        setChartData(result)
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
    <Card>
      <CardHeader>
        <CardTitle>Burndown Chart</CardTitle>
        <CardDescription>
          Showing completed issues per day for Sprint {sprintId}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 12, right: 12, top: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(5)} // show MM-DD
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Area
              dataKey="done"
              type="natural"
              fill="var(--color-done)"
              fillOpacity={0.4}
              stroke="var(--color-done)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              Trending up by {chartData.reduce((a, b) => a + b.done, 0)} issues{" "}
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              {chartData[0]?.date} – {chartData[chartData.length - 1]?.date}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
