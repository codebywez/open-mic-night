import { SiteHeader } from "@/components/site-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function EventLoading() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </main>
    </>
  );
}
