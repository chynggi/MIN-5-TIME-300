import GradientBackgroundLayout from '@/components/layout/GradientBackgroundLayout';

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return (
    <GradientBackgroundLayout fullBleed>
      {children}
    </GradientBackgroundLayout>
  );
}
