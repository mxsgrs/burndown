import { Burndown } from "./burdown"

export default function Home() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-full max-w-3xl">
        <Burndown sprintId="1335" />
      </div>
    </div>
  )
}