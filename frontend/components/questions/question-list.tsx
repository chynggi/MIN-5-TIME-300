'use client'

import { useQuestions, useVoteQuestion } from '@/hooks/useQuestions'
import { QuestionSkeleton } from './question-skeleton'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react"
import Link from 'next/link'

interface QuestionListProps {
  filter: string;
  sortBy: string;
}

export function QuestionList({ filter, sortBy }: QuestionListProps) {
  const { 
    data, 
    isLoading, 
    error 
  } = useQuestions({ status: filter })

  const { mutate: voteQuestion } = useVoteQuestion()

  const handleVote = (id: number, voteType: 'upvote' | 'downvote') => {
    voteQuestion({ id, voteType })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <QuestionSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error instanceof Error ? error.message : '오류가 발생했습니다.'}
        </AlertDescription>
      </Alert>
    )
  }

  if (!data?.data || data.data.length === 0) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="text-center text-muted-foreground">
            아직 제안된 질문이 없습니다.
          </div>
        </CardContent>
      </Card>
    )
  }

  const filteredQuestions = data.data
    .filter(question => filter === 'all' ? true : question.status === filter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.upvotes - a.upvotes;
        case 'controversial':
          return (b.upvotes + b.downvotes) - (a.upvotes + a.downvotes);
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  return (
    <div className="space-y-4">
      {filteredQuestions.map((question) => (
        <Card key={question.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle>{question.title}</CardTitle>
              <span className="text-sm text-muted-foreground">
                {question.category}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {question.description}
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {question.author.name}
              </span>
              <span className="text-sm text-muted-foreground">
                {new Date(question.created_at).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleVote(question.id, 'upvote')}
              >
                <ThumbsUp className="mr-1 h-4 w-4" />
                {question.upvotes}
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleVote(question.id, 'downvote')}
              >
                <ThumbsDown className="mr-1 h-4 w-4" />
                {question.downvotes}
              </Button>
              <Button variant="ghost" size="sm">
                <MessageSquare className="mr-1 h-4 w-4" />
                {question.comment_count || 0}
              </Button>
            </div>
            <Link href={`/questions/${question.id}`}>
              <Button variant="secondary" size="sm">
                자세히 보기
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}