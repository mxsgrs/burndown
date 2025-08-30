import { BurndownChart } from "@/components/charts/burdown"

export default async function Page({ params }: { params: Promise<{ sprintId: string }> }) {
  const { sprintId } = await params;

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-full max-w-3xl">
        <BurndownChart sprintId={sprintId} />
      </div>
    </div>
  );
}