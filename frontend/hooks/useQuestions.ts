import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { questionService } from '@/services/questionService'
import type { Question, CreateQuestionDto } from '@/services/questionService'

// 질문 목록 조회 훅
export function useQuestions(params?: {
  status?: string
  category?: string
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: ['questions', params],
    queryFn: () => questionService.getQuestions(params)
  })
}

// 질문 상세 조회 훅
export function useQuestion(id: number) {
  return useQuery({
    queryKey: ['questions', id],
    queryFn: () => questionService.getQuestionById(id)
  })
}

// 질문 생성 훅
export function useCreateQuestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateQuestionDto) => 
      questionService.createQuestion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] })
    }
  })
}

// 질문 투표 훅
export function useVoteQuestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, voteType }: { id: number; voteType: 'upvote' | 'downvote' }) =>
      questionService.voteQuestion(id, voteType),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['questions', variables.id] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['questions'] 
      })
    }
  })
}