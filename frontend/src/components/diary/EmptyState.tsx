import Link from "next/link";

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-white/60 dark:bg-neutral-800/60">
      <div className="text-5xl mb-4">📘</div>
      <h3 className="font-semibold mb-2">아직 작성한 일기가 없어요</h3>
      <p className="text-sm text-gray-500 mb-6">오늘 하루를 간단히 기록해보세요. 5분이면 충분해요!</p>
      <Link href="/diary/new" className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 shadow">첫 일기 쓰기</Link>
    </div>
  );
}
