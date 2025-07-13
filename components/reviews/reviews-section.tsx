"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getReviewsForAccommodation, createAccommodationReview } from "@/services/reviews"
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import ReviewForm from "./review-form"
import RatingStars from "./rating-stars"
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type ReviewsSectionProps = {
  accommodationId: string | number
  revieweeId?: string
  landlordId?: string
  className?: string
}

export default function ReviewsSection({ accommodationId, revieweeId, landlordId, className }: ReviewsSectionProps) {
  const { session } = useSession()
  const colorScheme = useColorScheme()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [showAllReviews, setShowAllReviews] = useState(false)

  const queryKey = ["accommodationReviews", String(accommodationId)]
  const { data: reviews = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => getReviewsForAccommodation(String(accommodationId)),
  })

  const createReviewMutation = useMutation({
    mutationFn: createAccommodationReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      setShowForm(false)
      toast.success("Your review has been submitted.")
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to submit review. Please try again.")
    },
  })

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!session?.user || !revieweeId || !accommodationId || !landlordId) return
    createReviewMutation.mutate({
      reviewer_id: session.user.id,
      reviewee_id: revieweeId,
      accommodation_id: String(accommodationId),
      landlord_id: landlordId,
      rating,
      comment: comment || undefined,
    })
  }

  const canReview = session?.user && revieweeId && landlordId && session.user.id !== revieweeId && session.user.id !== landlordId

  const averageRating =
    reviews && reviews.length > 0 ? reviews.reduce((sum: any, review: any) => sum + review.rating, 0) / reviews.length : 0

  const displayedReviews = showAllReviews ? reviews : reviews?.slice(0, 3)

  return (
    <div className={cn("mt-4", className)}>
      <div className="flex justify-between items-center mb-4">
        <span className="text-lg font-bold">Reviews</span>
        {reviews && reviews.length > 0 && (
          <div className="flex items-center">
            <span className="text-base font-bold mr-1">{averageRating.toFixed(1)}</span>
            <RatingStars rating={averageRating} size={16} />
            <span className="text-sm text-muted-foreground ml-1">({reviews.length})</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-5">
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: Colors[colorScheme ?? "light"].tint }} />
        </div>
      ) : reviews && reviews.length > 0 ? (
        <>
          {displayedReviews?.map((review: any) => (
            <div key={review.id} className="mb-4 p-4 bg-white rounded-lg shadow flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-primary">{review.reviewer_name || 'User'}</span>
                <RatingStars rating={review.rating} size={16} />
                <span className="text-xs text-muted-foreground ml-2">{review.created_at && new Date(review.created_at.seconds ? review.created_at.seconds * 1000 : review.created_at).toLocaleDateString()}</span>
              </div>
              {review.comment && <div className="text-sm mt-1">{review.comment}</div>}
            </div>
          ))}

          {reviews.length > 3 && (
            <button
              className="flex items-center justify-center py-2 w-full text-sm text-primary hover:text-primary/80 transition-colors"
              onClick={() => setShowAllReviews(!showAllReviews)}
            >
              <span>{showAllReviews ? "Show Less" : `Show All (${reviews.length})`}</span>
              {showAllReviews ? (
                <ChevronUp className="h-4 w-4 ml-1" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-1" />
              )}
            </button>
          )}
        </>
      ) : (
        <span className="text-sm text-muted-foreground italic mb-4">No reviews yet.</span>
      )}

      {canReview && (
        <Button
          className="w-full mt-2"
          onClick={() => setShowForm(true)}
          style={{ backgroundColor: Colors[colorScheme ?? "light"].tint }}
        >
          Write a Review
        </Button>
      )}

      {canReview && showForm && (
        <ReviewForm onSubmit={handleSubmitReview} isSubmitting={createReviewMutation.isPending} />
      )}
    </div>
  )
}
