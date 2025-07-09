"use client"

import { useState } from "react"
import { Text } from "@/components/themed"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getReviewsForUser, getReviewsForListing, getReviewsForAccommodation, createReview } from "@/services/reviews"
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import ReviewCard from "./review-card"
import ReviewForm from "./review-form"
import RatingStars from "./rating-stars"
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type ReviewsSectionProps = {
  userId?: string
  listingId?: string | number
  accommodationId?: string | number
  revieweeId?: string
  className?: string
}

export default function ReviewsSection({ userId, listingId, accommodationId, revieweeId, className }: ReviewsSectionProps) {
  const { session } = useSession()
  const colorScheme = useColorScheme()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [showAllReviews, setShowAllReviews] = useState(false)

  const queryFn = () => {
    if (userId) {
      return getReviewsForUser(userId)
    } else if (listingId) {
      return getReviewsForListing(listingId)
    } else if (accommodationId) {
      return getReviewsForAccommodation(accommodationId)
    }
    return Promise.resolve([])
  }

  const queryKey = userId
    ? ["userReviews", userId]
    : listingId
      ? ["listingReviews", listingId]
      : ["accommodationReviews", accommodationId]

  const { data: reviews, isLoading } = useQuery({
    queryKey,
    queryFn,
  })

  const createReviewMutation = useMutation({
    mutationFn: createReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      setShowForm(false)
      toast.success("Your review has been submitted.")
    },
    onError: (error) => {
      console.error("Error creating review:", error)
      toast.error("Failed to submit review. Please try again.")
    },
  })

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!session || !revieweeId) return

    const review = {
      reviewer_id: session.user.id,
      reviewee_id: revieweeId,
      rating,
      comment: comment || null,
      ...(listingId ? { listing_id: listingId } : {}),
      ...(accommodationId ? { accommodation_id: accommodationId } : {}),
    }

    createReviewMutation.mutate(review)
  }

  const canReview = session && revieweeId && session.user.id !== revieweeId

  const averageRating =
    reviews && reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0

  const displayedReviews = showAllReviews ? reviews : reviews?.slice(0, 3)

  return (
    <div className={cn("mt-4", className)}>
      <div className="flex justify-between items-center mb-4">
        <Text className="text-lg font-bold">Reviews</Text>
        {reviews && reviews.length > 0 && (
          <div className="flex items-center">
            <Text className="text-base font-bold mr-1">{averageRating.toFixed(1)}</Text>
            <RatingStars rating={averageRating} size={16} />
            <Text className="text-sm text-muted-foreground ml-1">({reviews.length})</Text>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-5">
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: Colors[colorScheme ?? "light"].tint }} />
        </div>
      ) : reviews && reviews.length > 0 ? (
        <>
          {displayedReviews?.map((review) => (
            <ReviewCard key={review.id.toString()} review={review} />
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
        <Text className="text-sm text-muted-foreground italic mb-4">No reviews yet.</Text>
      )}

      {canReview && !showForm && (
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
