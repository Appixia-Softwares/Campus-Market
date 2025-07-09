"use client"

import { useState } from "react"
import { Text } from "@/components/themed"
import RatingStars from "./rating-stars"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

type ReviewFormProps = {
  onSubmit: (rating: number, comment: string) => Promise<void>
  isSubmitting: boolean
  className?: string
}

export default function ReviewForm({ onSubmit, isSubmitting, className }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const colorScheme = useColorScheme()

  const handleSubmit = async () => {
    if (rating === 0) return
    await onSubmit(rating, comment)
    setRating(0)
    setComment("")
  }

  return (
    <div className={cn("bg-white rounded-lg p-4 shadow-sm", className)}>
      <Text className="text-lg font-bold mb-4">Write a Review</Text>

      <div className="mb-4">
        <Text className="text-sm font-bold mb-2">Rating</Text>
        <RatingStars rating={rating} size={30} interactive onRatingChange={setRating} />
      </div>

      <div className="mb-4">
        <Text className="text-sm font-bold mb-2">Comment (Optional)</Text>
        <Textarea
          placeholder="Share your experience..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[100px] resize-none"
          maxLength={500}
        />
      </div>

      <Button
        className={cn(
          "w-full",
          rating === 0 && "opacity-50 cursor-not-allowed"
        )}
        onClick={handleSubmit}
        disabled={rating === 0 || isSubmitting}
        style={{ backgroundColor: Colors[colorScheme ?? "light"].tint }}
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <span className="text-white font-bold">Submit Review</span>
        )}
      </Button>
    </div>
  )
}
