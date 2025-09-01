// 대시보드 전용 레이아웃: 전체 배경은 유지, 내부 콘텐츠는 가운데 2/3 폭으로 제한
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50">
      <div className="mx-auto w-full md:w-2/3 xl:max-w-5xl px-4 md:px-6 py-6">
        {children}
      </div>
    </div>
  );
}
