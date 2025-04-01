'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()

  return (
    <div className="container mx-auto max-w-md py-20">
      <Card>
        <CardHeader>
          <CardTitle>로그인</CardTitle>
          <CardDescription>서비스를 이용하시려면 로그인이 필요합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="default"
            className="w-full"
            onClick={() => router.push('/auth/google')}
          >
            Google로 계속하기
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            아직 계정이 없으신가요?{' '}
            <Link href="/register" className="text-indigo-600 hover:underline">
              회원가입
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}