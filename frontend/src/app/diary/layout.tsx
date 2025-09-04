import GradientBackgroundLayout from '@/components/layout/GradientBackgroundLayout';

export default function DiaryLayout({ children }: { children: React.ReactNode }) {
  return (
    <GradientBackgroundLayout>
      {children}
    </GradientBackgroundLayout>
  );
}
