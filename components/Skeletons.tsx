"use client";

export function SkeletonBox({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-gray-200/70 ${className}`} />
  );
}

export function PropertiesGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <SkeletonBox className="w-full h-48 mb-4" />
          <div className="space-y-3">
            <SkeletonBox className="h-6 w-2/3" />
            <SkeletonBox className="h-4 w-1/2" />
            <div className="grid grid-cols-2 gap-4">
              <SkeletonBox className="h-10" />
              <SkeletonBox className="h-10" />
            </div>
            <SkeletonBox className="h-2 w-full" />
            <div className="flex gap-2 pt-2">
              <SkeletonBox className="h-10 w-full" />
              <SkeletonBox className="h-10 w-10" />
              <SkeletonBox className="h-10 w-10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function UnitsGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="rounded-xl border-2 border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <SkeletonBox className="w-10 h-10" />
              <div>
                <SkeletonBox className="h-3 w-14 mb-1" />
                <SkeletonBox className="h-4 w-16" />
              </div>
            </div>
            <SkeletonBox className="h-5 w-20" />
          </div>
          <SkeletonBox className="h-12 w-full" />
        </div>
      ))}
    </div>
  );
}

export function TenantsListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <SkeletonBox className="w-10 h-10 rounded-full" />
            <div>
              <SkeletonBox className="h-4 w-40 mb-1" />
              <SkeletonBox className="h-3 w-24" />
            </div>
          </div>
          <SkeletonBox className="h-8 w-24" />
        </div>
      ))}
    </div>
  );
}


