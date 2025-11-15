// Vector DB (Pinecone) 타입 정의
// 분리 목적: 서비스 코드 경량화 및 재사용 편의

export interface BaseVectorMetadata {
  userId: string;
  type: 'diary' | 'feedback' | 'other';
  createdAt: string; // ISO 문자열
  journalId?: string; // feedback 등 연관된 일기 ID
  visibility?: 'public' | 'private';
  modelVersion?: string; // 임베딩 모델 버전 식별
  [key: string]: any; // 확장 허용
}

export interface UpsertVectorItem<
  M extends Record<string, any> = BaseVectorMetadata,
> {
  id: string;
  values: number[];
  metadata?: M;
}

export interface QueryVectorOptions {
  vector: number[];
  topK: number;
  filter?: Record<string, any>;
  includeMetadata?: boolean;
}
