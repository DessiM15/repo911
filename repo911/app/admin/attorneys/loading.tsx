import { Skeleton, SkeletonTable } from '@/components/ui/skeleton';

export default function AdminAttorneysLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-10 w-56 rounded-lg" />
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>
      <SkeletonTable rows={8} />
    </div>
  );
}
