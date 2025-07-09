import { Star } from "lucide-react"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import { cn } from "@/lib/utils"

type RatingStarsProps = {
  rating: number
  size?: number
  color?: string
  interactive?: boolean
  onRatingChange?: (rating: number) => void
  className?: string
}

export default function RatingStars({
  rating,
  size = 20,
  color,
  interactive = false,
  onRatingChange,
  className,
}: RatingStarsProps) {
  const colorScheme = useColorScheme()
  const starColor = color || Colors[colorScheme ?? "light"].tint

  const handleClick = (selectedRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(selectedRating)
    }
  }

  return (
    <div className={cn("flex flex-row", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => handleClick(star)}
          disabled={!interactive}
          className="mr-0.5 p-0.5 hover:scale-110 transition-transform disabled:cursor-default disabled:hover:scale-100"
          type="button"
        >
          <Star
            size={size}
            color={starColor}
            fill={star <= Math.round(rating) ? starColor : "transparent"}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  )
}
