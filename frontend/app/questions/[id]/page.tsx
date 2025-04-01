'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ThumbsUp, ThumbsDown, Send } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useQuestion, useVoteQuestion } from '@/hooks/useQuestions'

export default function QuestionDetailPage() {
  const params = useParams()
  const { data, isLoading } = useQuestion(Number(params.id))
  const { mutate: voteQuestion } = useVoteQuestion()
  const [newComment, setNewComment] = useState('')

  const handleVote = (voteType: 'upvote' | 'downvote') => {
    voteQuestion({ id: Number(params.id), voteType })
  }

  return (
    <div className="container mx-auto py-6">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{data?.data?.question?.title}</CardTitle>
              <CardDescription className="mt-2">
                {data?.data?.question?.description}
              </CardDescription>
            </div>
            <Badge>{data?.data?.question?.category}</Badge>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Avatar>
              <AvatarImage src={data?.data?.question?.author.avatar} />
              <AvatarFallback>{data?.data?.question?.author.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{data?.data?.question?.author.name}</p>
              <p className="text-sm text-muted-foreground">{data?.data?.question?.created_at}</p>
            </div>
          </div>
        </CardHeader>
        <CardFooter>
          <div className="flex gap-4">
            <Button variant="outline" size="sm" onClick={() => handleVote('upvote')}>
              <ThumbsUp className="mr-1 h-4 w-4" />
              {data?.data?.question?.upvotes}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleVote('downvote')}>
              <ThumbsDown className="mr-1 h-4 w-4" />
              {data?.data?.question?.downvotes}
            </Button>
          </div>
        </CardFooter>
      </Card>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">댓글</h2>
        <div className="flex gap-4 mb-6">
          <Avatar>
            <AvatarImage src="/placeholder-user.jpg" />
            <AvatarFallback>나</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder="댓글을 작성해주세요..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <div className="flex justify-end mt-2">
              <Button>
                <Send className="mr-2 h-4 w-4" />
                댓글 작성
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {data?.data?.comments?.map((comment) => (
            <Card key={comment.id}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarImage src={comment.author.avatar} />
                    <AvatarFallback>{comment.author.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{comment.author.name}</p>
                      <p className="text-sm text-muted-foreground">{comment.created_at}</p>
                    </div>
                    <p className="mt-2">{comment.comment}</p>
                  </div>
                </div>
              </CardHeader>
              <CardFooter>
                <Button variant="ghost" size="sm">
                  <ThumbsUp className="mr-1 h-4 w-4" />
                  {comment.upvotes}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}