import BurndownSelect from "@/components/burndown/select";

export default async function Page() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-full max-w-3xl">
          <BurndownSelect />
      </div>
    </div>
  );
}