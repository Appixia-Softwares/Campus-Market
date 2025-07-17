"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { User, GraduationCap, Phone, FileText, Camera } from "lucide-react"
import { toast } from "sonner"
import { getUniversities } from "@/lib/api/auth"
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { useIsMobile } from "@/hooks/use-mobile";
import confetti from "canvas-confetti";

interface University {
  id: string
  name: string
  location: string
}

export function OnboardingModal() {
  const { user, updateProfile } = useAuth();
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [universities, setUniversities] = useState<University[]>([])
  const [isLoadingUniversities, setIsLoadingUniversities] = useState(true)

  // Form data
  const [fullName, setFullName] = useState("")
  const [universityId, setUniversityId] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [bio, setBio] = useState("")

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>("")
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Track if avatar was uploaded in this session
  const [avatarUploaded, setAvatarUploaded] = useState(false);

  const isMobile = useIsMobile();
  const [showWhatsNext, setShowWhatsNext] = useState(false);
  const [skipWarning, setSkipWarning] = useState(false);

  // Load universities from database
  useEffect(() => {
    async function loadUniversities() {
      setIsLoadingUniversities(true)
      try {
        const { data, error } = await getUniversities()
        if (error) {
          console.error("Error loading universities:", error)
          toast.error("Failed to load universities")
          return
        }
        if (data) {
          setUniversities(data)
        }
      } catch (err) {
        console.error("Unexpected error loading universities:", err)
        toast.error("Failed to load universities")
      } finally {
        setIsLoadingUniversities(false)
      }
    }

    loadUniversities()
  }, [])

  // Check if profile is incomplete
  const isProfileIncomplete = (user: any) => {
    if (!user) return true
    return (
      !user.full_name ||
      user.full_name === "User" ||
      !user.university_id ||
      !user.phone ||
      !user.bio ||
      user.status === "pending"
    )
  }

  useEffect(() => {
    if (user && isProfileIncomplete(user)) {
      setOpen(true)
      // Pre-fill existing data
      setFullName(user.full_name || "")
      setUniversityId(user.university_id || "")
      setBio(user.bio || "")
      if (user.phone) {
        // Remove +263 prefix if it exists
        const phone = user.phone.replace("+263", "").trim()
        setPhoneNumber(phone)
      }
    }
  }, [user])

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1)
    }
  }

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "")

    // Limit to 9 digits (Zimbabwe mobile numbers)
    const limitedDigits = digits.slice(0, 9)

    // Format as XXX XXX XXX
    if (limitedDigits.length <= 3) {
      return limitedDigits
    } else if (limitedDigits.length <= 6) {
      return `${limitedDigits.slice(0, 3)} ${limitedDigits.slice(3)}`
    } else {
      return `${limitedDigits.slice(0, 3)} ${limitedDigits.slice(3, 6)} ${limitedDigits.slice(6)}`
    }
  }

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value)
    setPhoneNumber(formatted)
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type and size
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      toast.error("Image must be less than 5MB")
      return
    }

    setAvatarFile(file)
    setAvatarUploaded(true)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleComplete = async () => {
    setLoading(true)
    try {
      if (!user) throw new Error("No user logged in")
      // Format phone number with Zimbabwe country code
      const cleanPhone = phoneNumber.replace(/\s/g, "")
      const fullPhoneNumber = `+263${cleanPhone}`
      // Validate required fields
      if (!fullName.trim()) { toast.error("Please enter your full name"); return }
      if (!universityId) { toast.error("Please select your university"); return }
      if (cleanPhone.length !== 9) { toast.error("Please enter a valid phone number"); return }
      if (!bio.trim()) { toast.error("Please tell us about yourself"); return }
      let avatarUrl = undefined
      // Only upload avatar if a new one was selected
      if (avatarFile && avatarUploaded && user) {
        setUploadingAvatar(true)
        try {
          const storage = getStorage();
          const filePath = `avatars/${user.id}-${Date.now()}`;
          const fileRef = storageRef(storage, filePath);
          await uploadBytes(fileRef, avatarFile);
          avatarUrl = await getDownloadURL(fileRef);
        } catch (error) {
          console.error("Error uploading avatar:", error)
          toast.error("Failed to upload avatar, but profile will be saved")
        } finally {
          setUploadingAvatar(false)
        }
      }
      // Only send changed fields
      const update: Record<string, any> = {}
      if (fullName.trim() !== user.full_name) update.full_name = fullName.trim()
      if (universityId !== user.university_id) update.university_id = universityId
      if (fullPhoneNumber !== user.phone) update.phone = fullPhoneNumber
      if (bio.trim() !== user.bio) update.bio = bio.trim()
      if (avatarUrl) update.avatar_url = avatarUrl
      update.status = "active"
      await updateProfile(update)
      toast.success("Profile completed successfully! Welcome to CampusMarket Zimbabwe!")
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.7 } })
      setOpen(false)
      setShowWhatsNext(true)
    } catch (error: any) {
      console.error("Error completing onboarding:", error)
      toast.error(error.message || "Failed to complete profile. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return fullName.trim().length >= 2 && avatarFile !== null
      case 2:
        return universityId.length > 0
      case 3:
        return phoneNumber.replace(/\s/g, "").length === 9
      case 4:
        return bio.trim().length >= 10
      default:
        return false
    }
  }

  const progress = (step / 4) * 100

  return (
    <>
      <Dialog open={open} onOpenChange={() => {}} modal aria-label="Onboarding Modal">
        <DialogContent className={isMobile ? "sm:max-w-full max-w-full p-0 rounded-t-2xl" : "sm:max-w-md"} style={isMobile ? { bottom: 0, position: 'fixed', left: 0, right: 0 } : {}}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">🇿🇼</span>
              Complete Your Profile
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Welcome to CampusMarket Zimbabwe - connecting students across the country
            </p>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Step {step} of 4</span>
                <span>{Math.round(progress)}% complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            {/* Step illustrations/icons and tooltips */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="relative mx-auto w-24 h-24 mb-4">
                    <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                      {avatarPreview ? (
                        <img src={avatarPreview || "/placeholder.svg"} alt="Avatar preview" className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" id="avatar-upload" />
                    <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors shadow-lg" title="Upload your photo">
                      <Camera className="h-4 w-4" />
                    </label>
                  </div>
                  <h3 className="text-lg font-semibold">Upload your photo</h3>
                  <p className="text-sm text-muted-foreground">Help other students recognize you</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" autoFocus aria-label="Full Name" title="Enter your full name as it appears on your student ID" />
                  <span className="text-xs text-muted-foreground">Use your real name for trust and verification.</span>
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-4">
                <div className="text-center">
                  <GraduationCap className="mx-auto h-12 w-12 text-blue-600 mb-4" />
                  <h3 className="text-lg font-semibold">Which university do you attend?</h3>
                  <p className="text-sm text-muted-foreground">Connect with students from your campus</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="university">University</Label>
                  <Select value={universityId} onValueChange={setUniversityId} aria-label="University">
                    <SelectTrigger>
                      <SelectValue placeholder="Select your university" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingUniversities ? (
                        <SelectItem value="loading" disabled>Loading universities...</SelectItem>
                      ) : (
                        universities.map((uni) => (
                          <SelectItem key={uni.id} value={uni.id} title={uni.location}>
                            <div>
                              <div className="font-medium">{uni.name}</div>
                              <div className="text-sm text-muted-foreground">{uni.location}</div>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">This helps us connect you with your campus community.</span>
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-4">
                <div className="text-center">
                  <Phone className="mx-auto h-12 w-12 text-blue-600 mb-4" />
                  <h3 className="text-lg font-semibold">What's your phone number?</h3>
                  <p className="text-sm text-muted-foreground">For account security and communication</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Mobile Number</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-muted">
                      <span className="text-lg">🇿🇼</span>
                      <span className="font-medium">+263</span>
                    </div>
                    <Input id="phone" type="tel" placeholder="77 123 4567" value={phoneNumber} onChange={(e) => handlePhoneChange(e.target.value)} className="flex-1" maxLength={11} aria-label="Mobile Number" title="Enter your Zimbabwean mobile number" />
                  </div>
                  <span className="text-xs text-muted-foreground">Enter your mobile number without the country code (e.g., 77 123 4567).</span>
                </div>
              </div>
            )}
            {step === 4 && (
              <div className="space-y-4">
                <div className="text-center">
                  <FileText className="mx-auto h-12 w-12 text-blue-600 mb-4" />
                  <h3 className="text-lg font-semibold">Tell us about yourself</h3>
                  <p className="text-sm text-muted-foreground">Share your interests, what you're studying, or what you're looking for</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">About You</Label>
                  <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="I'm a Computer Science student at UZ, interested in technology and looking for affordable accommodation near campus..." rows={4} maxLength={500} aria-label="About You" title="Tell us about yourself" />
                  <span className="text-xs text-muted-foreground">{bio.length}/500 characters</span>
                </div>
              </div>
            )}
            {/* Skip for now option */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious} disabled={step === 1}>Previous</Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setSkipWarning(true)} aria-label="Skip onboarding" title="Skip onboarding">Skip for now</Button>
                {step < 4 ? (
                  <Button onClick={handleNext} disabled={!canProceed()}>Next</Button>
                ) : (
                  <Button onClick={handleComplete} disabled={!canProceed() || loading || uploadingAvatar}>
                    {(loading || uploadingAvatar) ? "Completing..." : "Complete Profile"}
                  </Button>
                )}
              </div>
            </div>
            {/* Skip warning dialog */}
            {skipWarning && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-auto">
                  <h4 className="font-bold mb-2">Are you sure you want to skip?</h4>
                  <p className="text-sm text-muted-foreground mb-4">You can complete your profile later, but some features may be limited until you do.</p>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setSkipWarning(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={() => { setOpen(false); setSkipWarning(false); }}>Skip</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* What's next screen after completion */}
      {showWhatsNext && (
        <Dialog open={showWhatsNext} onOpenChange={() => setShowWhatsNext(false)} modal aria-label="Onboarding Complete">
          <DialogContent className="sm:max-w-md text-center">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 justify-center">
                <span className="text-2xl">🎉</span> Welcome to CampusMarket!
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-lg font-semibold mb-2">Your profile is complete.</p>
              <p className="text-muted-foreground mb-4">You can now explore the marketplace, list your first item, or update your settings.</p>
              <div className="flex flex-col gap-2">
                <Button asChild variant="default"><a href="/marketplace">Go to Marketplace</a></Button>
                <Button asChild variant="secondary"><a href="/marketplace/sell">List Your First Item</a></Button>
                <Button asChild variant="outline"><a href="/settings">Update Settings</a></Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
