"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { deleteProductListingAction, deleteAccommodationListingAction, deleteServiceListingAction } from "@/app/actions/listings"
import { ListingType } from "@/app/actions/listings"

interface DeleteListingButtonProps {
  listingId: string
  listingType: ListingType
  userId: string
  onSuccess?: () => void
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export default function DeleteListingButton({
  listingId,
  listingType,
  userId,
  onSuccess,
  variant = "destructive",
  size = "icon",
  className = ""
}: DeleteListingButtonProps) {
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const handleDelete = async () => {
    // Double-check that user really wants to delete
    if (!showConfirmDialog) {
      toast({
        title: "Action cancelled",
        description: "Please confirm the deletion in the dialog",
        variant: "destructive",
      })
      return
    }

    try {
      setIsDeleting(true)
      
      let result
      switch (listingType) {
        case 'product':
          result = await deleteProductListingAction(listingId, userId)
          break
        case 'accommodation':
          result = await deleteAccommodationListingAction(listingId, userId)
          break
        case 'service':
          result = await deleteServiceListingAction(listingId, userId)
          break
        default:
          throw new Error(`Unsupported listing type: ${listingType}`)
      }
      
      if (result.success) {
        toast({
          title: `${listingType.charAt(0).toUpperCase() + listingType.slice(1)} deleted`,
          description: `Your ${listingType} listing has been removed successfully`,
        })
        onSuccess?.()
      } else {
        toast({
          title: "Error",
          description: result.error || `Failed to delete ${listingType}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(`Error deleting ${listingType}:`, error)
      toast({
        title: "Error",
        description: `Failed to delete ${listingType}`,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowConfirmDialog(false)
    }
  }

  const getListingTypeLabel = () => {
    switch (listingType) {
      case 'product':
        return 'product'
      case 'accommodation':
        return 'accommodation'
      case 'service':
        return 'service'
      default:
        return 'listing'
    }
  }

  const getWarningMessage = () => {
    const baseMessage = `Are you absolutely sure you want to delete this ${getListingTypeLabel()}?`
    const consequences = "This action cannot be undone and will permanently remove:"
    const items = [
      "• The listing itself",
      "• All associated images",
      "• User favorites and bookmarks",
      "• Reviews and ratings",
      "• Messages and conversations",
      "• Notifications related to this listing"
    ]
    
    if (listingType === 'accommodation') {
      items.push("• All bookings and reservations")
    }
    
    return (
      <div className="space-y-2">
        <p className="font-semibold text-destructive">{baseMessage}</p>
        <p>{consequences}</p>
        <ul className="list-none space-y-1 text-sm text-muted-foreground">
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
        <p className="text-sm font-medium text-destructive mt-3">
          ⚠️ This action is permanent and cannot be reversed!
        </p>
      </div>
    )
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowConfirmDialog(true)}
        className={className}
        aria-label={`Delete ${getListingTypeLabel()}`}
        disabled={isDeleting}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <AlertDialog 
        open={showConfirmDialog} 
        onOpenChange={(open) => {
          if (!open && isDeleting) {
            // Prevent closing dialog while deleting
            return
          }
          setShowConfirmDialog(open)
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete {getListingTypeLabel().charAt(0).toUpperCase() + getListingTypeLabel().slice(1)}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              {getWarningMessage()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={isDeleting}
              className="border-2 hover:bg-muted"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 border-2 border-destructive"
            >
              {isDeleting ? "Deleting..." : "Yes, Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 