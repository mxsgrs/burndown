import { BurndownChart } from "./burdown-chart"

export default function Home() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-full max-w-3xl">
        <BurndownChart sprintId="1335" />
      </div>
    </div>
  )
}