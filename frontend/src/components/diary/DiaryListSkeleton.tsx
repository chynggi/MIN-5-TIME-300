export default function DiaryListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-40 rounded-lg border bg-gradient-to-br from-gray-100 to-gray-50 dark:from-neutral-800 dark:to-neutral-700 relative overflow-hidden">
          <div className="absolute inset-0 animate-pulse">
            <div className="h-5 bg-white/60 dark:bg-neutral-600 w-3/4 rounded mt-4 mx-4" />
            <div className="h-3 bg-white/50 dark:bg-neutral-600 w-5/6 rounded mt-3 mx-4" />
            <div className="h-3 bg-white/40 dark:bg-neutral-600 w-2/3 rounded mt-2 mx-4" />
            <div className="h-3 bg-white/30 dark:bg-neutral-600 w-1/2 rounded mt-6 mx-4" />
          </div>
        </div>
      ))}
    </div>
  );
}
