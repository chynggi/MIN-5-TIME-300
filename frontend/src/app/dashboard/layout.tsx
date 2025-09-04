import GradientBackgroundLayout from '@/components/layout/GradientBackgroundLayout';

// 대시보드: 내부 너비 제한 유지
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <GradientBackgroundLayout>
      <div className="mx-auto w-full md:w-2/3 xl:max-w-5xl px-4 md:px-6">
        {children}
      </div>
    </GradientBackgroundLayout>
  );
}
