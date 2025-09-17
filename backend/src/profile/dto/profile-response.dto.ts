export class ProfileInterestDto {
  id: string;
  interest: string;
  priority: number;
}

export class ProfileResponseDto {
  id: string;
  email: string;
  username: string;
  mbti: string;
  bio?: string;
  birthDate?: string;
  location?: string;
  profileImageUrl: string;
  interests: ProfileInterestDto[];
  createdAt: string;
  activityScore?: number; // 0-100 활동 지수
  // 멘탈지수(최근 30일 체크인 기반 0-100)
  mentalIndex?: number;
  // 활동 KPI(최근 30일): 클릭률, 일기 작성 지속률, 다음날 재방문율(0~1 비율)
  activityKpis?: {
    clickRate: number;
    diaryContinuationRate: number;
    nextDayRevisitRate: number;
  };
  activityPublic?: boolean;
}
// 타인 프로필 상세 응답 DTO
export class OtherProfileResponseDto {
  id: string;
  username: string;
  bio?: string;
  diaryCount: number;
  followerCount: number;
  followingCount: number;
  lpgScore: number;
  isFollowing: boolean;
  isPublic: boolean;
  mbti: string;
  canViewCalendar?: boolean; // 달력 조회 권한 추가
  activityScore?: number; // 0-100 활동 지수
  // 멘탈지수(최근 30일)
  mentalIndex?: number;
  activityPublic?: boolean;
}
