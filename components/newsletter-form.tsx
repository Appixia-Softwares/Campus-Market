"use client"

import { useState } from "react"
import { subscribeToNewsletter } from "@/app/actions"
import { useToastContext } from "@/components/providers/toast-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToastContext()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("email", email)
      
      const result = await subscribeToNewsletter(formData)
      
      if (result.success) {
        toast({
          type: "celebration",
          title: "Welcome to Campus Market! 🎉",
          message: result.message,
          duration: 6000,
          sound: true
        })
        setEmail("")
      } else {
        toast({
          type: "warning",
          title: "Oops!",
          message: result.message,
          duration: 4000,
          sound: true
        })
      }
    } catch (error) {
      toast({
        type: "error",
        title: "Error",
        message: "Something went wrong. Please try again later.",
        duration: 4000,
        sound: true
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-12 rounded-lg border-gray-200 bg-white px-4 text-base"
        />
      </div>
      <Button
        type="submit"
        disabled={isLoading}
        className="h-12 rounded-lg bg-[#059669] text-white hover:bg-[#047857]"
      >
        {isLoading ? "Subscribing..." : "Subscribe to Newsletter"}
      </Button>
    </form>
  )
}
