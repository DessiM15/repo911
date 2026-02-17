import { Skeleton, SkeletonTable } from '@/components/ui/skeleton';

export default function AdminLeadsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-10 w-56 rounded-lg" />
        <Skeleton className="h-10 w-36 rounded-lg" />
        <Skeleton className="h-10 w-36 rounded-lg" />
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>
      <SkeletonTable rows={10} />
    </div>
  );
}
