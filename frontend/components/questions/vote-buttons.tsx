interface VoteButtonsProps {
  questionId: number;
  upvotes: number;
  downvotes: number;
  onVote: (type: 'upvote' | 'downvote') => void;
}

export function VoteButtons({ questionId, upvotes, downvotes, onVote }: VoteButtonsProps) {
  return (
    <div className="flex gap-4">
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => onVote('upvote')}
      >
        <ThumbsUp className="mr-1 h-4 w-4" />
        {upvotes}
      </Button>
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => onVote('downvote')}
      >
        <ThumbsDown className="mr-1 h-4 w-4" />
        {downvotes}
      </Button>
    </div>
  )
}