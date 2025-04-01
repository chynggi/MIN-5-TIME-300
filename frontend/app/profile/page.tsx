'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useProfile } from '@/hooks/useProfile'

export default function ProfilePage() {
  const { data: profile, isLoading, error } = useProfile()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    mbti: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  if (isLoading) return <div>로딩 중...</div>
  if (error) return <div>에러가 발생했습니다.</div>

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">프로필 설정</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* 프로필 이미지 카드 */}
        <Card>
          <CardHeader>
            <CardTitle>프로필 이미지</CardTitle>
            <CardDescription>프로필 이미지를 변경할 수 있습니다</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Avatar className="h-32 w-32">
              <AvatarImage src={profile?.profile_image || '/placeholder-user.jpg'} />
              <AvatarFallback>프로필</AvatarFallback>
            </Avatar>
            <Button variant="outline">이미지 변경</Button>
          </CardContent>
        </Card>

        {/* 프로필 정보 카드 */}
        <Card>
          <CardHeader>
            <CardTitle>프로필 정보</CardTitle>
            <CardDescription>기본 정보를 수정할 수 있습니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">사용자 이름</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({...prev, username: e.target.value}))}
                readOnly={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                readOnly={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mbti">MBTI</Label>
              <Select 
                disabled={!isEditing} 
                value={formData.mbti}
                onValueChange={(value) => setFormData(prev => ({...prev, mbti: value}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="MBTI 선택" />
                </SelectTrigger>
                <SelectContent>
                  {['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP',
                    'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'].map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              className="w-full"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? '저장' : '수정'}
            </Button>
          </CardContent>
        </Card>

        {/* 비밀번호 변경 카드 */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>비밀번호 변경</CardTitle>
            <CardDescription>새로운 비밀번호로 변경할 수 있습니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">현재 비밀번호</Label>
              <Input 
                id="currentPassword" 
                type="password"
                value={formData.currentPassword}
                onChange={(e) => setFormData(prev => ({...prev, currentPassword: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">새 비밀번호</Label>
              <Input 
                id="newPassword" 
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData(prev => ({...prev, newPassword: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <Input 
                id="confirmPassword" 
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({...prev, confirmPassword: e.target.value}))}
              />
            </div>
            <Button className="w-full">비밀번호 변경</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}