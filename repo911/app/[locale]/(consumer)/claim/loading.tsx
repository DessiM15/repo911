import { Skeleton } from '@/components/ui/skeleton';

export default function ClaimLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="text-center mb-8">
        <Skeleton className="h-10 w-72 mx-auto" />
        <Skeleton className="h-5 w-96 mx-auto mt-3" />
      </div>
      <Skeleton className="h-4 w-full rounded-full mb-8" />
      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
