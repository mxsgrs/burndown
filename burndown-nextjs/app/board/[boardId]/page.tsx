import BurndownSelect from "@/components/burndown/select";

export default async function Page(props: { params: Promise<{ boardId: string }> }) {
    const params = await props.params;
    const { boardId } = params;
    const id = parseInt(boardId);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-full max-w-3xl">
          <BurndownSelect boardId={id} />
      </div>
    </div>
  );
}