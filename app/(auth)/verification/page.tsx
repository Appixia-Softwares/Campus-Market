"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Shield,
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  Camera,
  GraduationCap,
  Phone,
  Mail,
  AlertTriangle,
  Info,
  Loader2,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { uploadFileToStorage, auth } from '@/lib/firebase'
import { getFirestore, collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { sendEmailVerification } from 'firebase/auth';
import { useRouter } from "next/navigation"

interface VerificationRequest {
  id: string
  user_id: string
  verification_type: "student_id" | "phone" | "email"
  status: "pending" | "approved" | "rejected"
  documents: string[]
  notes: string
  submitted_at: string
  reviewed_at?: string
  reviewer_notes?: string
}

export default function VerificationPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([])

  // Student ID Verification
  const [studentIdFile, setStudentIdFile] = useState<File | null>(null)
  const [studentIdPreview, setStudentIdPreview] = useState<string>("")
  const [studentIdNumber, setStudentIdNumber] = useState("")
  const [additionalNotes, setAdditionalNotes] = useState("")

  // Email Verification
  const [emailVerificationSent, setEmailVerificationSent] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [checkingEmailStatus, setCheckingEmailStatus] = useState(false);

  // Add a state for payment status for ID verification
  const [idPaymentComplete, setIdPaymentComplete] = useState(false);

  // Add state for selfie file and preview
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string>("");

  useEffect(() => {
    if (user && user.email_verified) {
      router.replace("/dashboard")
    }
  }, [user, router])

  // Auto-refresh email verification status every 5 seconds if not verified
  useEffect(() => {
    if (!user || user.email_verified) return;
    let interval: NodeJS.Timeout;
    const autoCheck = async () => {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        const isVerified = auth.currentUser.emailVerified;
        setEmailVerified(isVerified);
        if (isVerified) {
          // Update Firestore user document
          const db = getFirestore();
          const userRef = doc(db, "users", auth.currentUser.uid);
          await updateDoc(userRef, { email_verified: true });
          clearInterval(interval);
        }
      }
    };
    interval = setInterval(autoCheck, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // Remove fetchVerificationRequests and all supabase logic

  // No longer needed: checkEmailVerification

  const handleStudentIdUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      toast({
        title: "File too large",
        description: "Image must be less than 10MB",
        variant: "destructive",
      })
      return
    }

    setStudentIdFile(file)

    const reader = new FileReader()
    reader.onload = (e) => {
      setStudentIdPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Handler for selfie upload
  const handleSelfieUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please upload an image file", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Image must be less than 10MB", variant: "destructive" });
      return;
    }
    setSelfieFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setSelfiePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const submitStudentIdVerification = async () => {
    if (!user || !studentIdFile || !studentIdNumber.trim()) {
      toast({
        title: "Missing information",
        description: "Please upload your student ID and enter your student number",
        variant: "destructive",
      })
      return
    }
    try {
      setSubmitting(true)
      setUploading(true)
      // Upload student ID image
      const fileExt = studentIdFile.name.split(".").pop()
      const fileName = `student-id-${user.id}-${Date.now()}.${fileExt}`
      const publicUrl = await uploadFileToStorage(fileName, studentIdFile)
      setUploading(false)
      // Create verification request in Firestore
      const db = getFirestore();
      await addDoc(collection(db, 'verification_requests'), {
        user_id: user.id,
        verification_type: 'student_id',
        status: 'pending',
        documents: [publicUrl],
        notes: additionalNotes,
        student_id_number: studentIdNumber,
        submitted_at: serverTimestamp(),
      });
      toast({
        title: "Verification submitted",
        description: "Your student ID verification has been submitted for review",
      })
      // Reset form
      setStudentIdFile(null)
      setStudentIdPreview("")
      setStudentIdNumber("")
      setAdditionalNotes("")
    } catch (error) {
      setUploading(false)
      setSubmitting(false)
      toast({
        title: "Error",
        description: "Failed to submit verification",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Send email verification using Firebase Auth
  const resendEmailVerification = async () => {
    if (!user) return;
    try {
      await sendEmailVerification(auth.currentUser!);
      setEmailVerificationSent(true);
      toast({
        title: "Verification email sent",
        description: "Please check your email and click the verification link",
      });
    } catch (error) {
      toast({
        title: "Failed to send email",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  }

  // Add a handler to check verification status
  const checkEmailVerificationStatus = async () => {
    if (!auth.currentUser) return;
    setCheckingEmailStatus(true);
    try {
      await auth.currentUser.reload();
      const isVerified = auth.currentUser.emailVerified;
      setEmailVerified(isVerified);
      if (isVerified) {
        // Update Firestore user document
        const db = getFirestore();
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, { email_verified: true });
      }
      toast({
        title: isVerified ? "Email verified!" : "Not verified yet",
        description: isVerified
          ? "Your email address has been verified."
          : "Please check your inbox and click the verification link.",
        variant: isVerified ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check verification status.",
        variant: "destructive",
      });
    } finally {
      setCheckingEmailStatus(false);
    }
  };

  const getVerificationProgress = () => {
    let completed = 0
    const total = 2

    if (user?.email_verified) completed++
    if (user?.verified) completed++

    return (completed / total) * 100
  }

  const getVerificationStatus = (type: string) => {
    const request = verificationRequests.find((r) => r.verification_type === type)
    if (!request) return null

    switch (request.status) {
      case "pending":
        return { icon: Clock, color: "text-yellow-500", text: "Under Review" }
      case "approved":
        return { icon: CheckCircle, color: "text-green-500", text: "Verified" }
      case "rejected":
        return { icon: XCircle, color: "text-red-500", text: "Rejected" }
      default:
        return null
    }
  }

  // Loading state is now handled above; always render main UI

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Account Verification</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Verify your account to build trust with other students and access exclusive features
          </p>

          {/* Progress */}
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Verification Progress</span>
                  <span>{Math.round(getVerificationProgress())}%</span>
                </div>
                <Progress value={getVerificationProgress()} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Email</span>
                  <span>Student ID</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Verification Tabs */}
        <Tabs defaultValue="email" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
              {user?.email_verified && <CheckCircle className="h-4 w-4 text-green-500" />}
            </TabsTrigger>
            <TabsTrigger value="id" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              ID Verification
              {user?.verified && <CheckCircle className="h-4 w-4 text-green-500" />}
            </TabsTrigger>
          </TabsList>

          {/* Email Verification (Mandatory) */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Verification
                  {user?.email_verified && (
                        <Badge variant="outline" className="ml-auto">
                      <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                      Verified
                        </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Verify your email address to secure your account and receive important notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!user?.email_verified && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      <b>Email verification is required to access your dashboard.</b>
                    </AlertDescription>
                  </Alert>
                )}
                {user?.email_verified ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>Your email address {user.email} has been verified!</AlertDescription>
                  </Alert>
                ) : (
                    <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{user?.email}</p>
                        <p className="text-sm text-muted-foreground">Your registered email address</p>
                      </div>
                      {!emailVerificationSent ? (
                        <Button onClick={resendEmailVerification}>Send Verification</Button>
                      ) : (
                        <Badge variant="outline">Email Sent</Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={checkEmailVerificationStatus} disabled={checkingEmailStatus} variant="outline">
                        {checkingEmailStatus ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        Check Verification Status
                      </Button>
                    </div>
                    {emailVerificationSent && (
                      <Alert>
                        <Mail className="h-4 w-4" />
                        <AlertDescription>
                          We've sent a verification link to your email. Please check your inbox and click the link to
                          verify your email address.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ID Verification (Optional, Paid) */}
          <TabsContent value="id">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  ID Verification (Optional)
                  {user?.verified && (
                    <Badge variant="outline" className="ml-auto">
                      <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                      Verified Badge
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Get a green verified badge by uploading your Student or Government ID and completing payment.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!idPaymentComplete ? (
                  <div className="space-y-4">
                    <Alert>
                      <AlertDescription>
                        <b>This step is optional and paid.</b> Complete payment to unlock ID verification and get a green verified tick on your profile.
                      </AlertDescription>
                    </Alert>
                    <Button onClick={() => setIdPaymentComplete(true)} className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600">
                      Pay &amp; Get Verified Badge
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Role-based ID verification UI */}
                    {user?.role === 'student' ? (
                      <>
                        <Alert>
                          <AlertDescription>
                            <b>Student ID Verification</b><br />
                            Please upload a clear photo of your official Student ID card. Make sure your name, photo, and student number are visible.<br />
                            <span className="text-xs text-muted-foreground">For extra security, also upload a selfie holding your student ID.</span>
                          </AlertDescription>
                        </Alert>
                        {/* Student ID upload (reuse existing logic) */}
                      <div className="space-y-2">
                          <Label>Student ID Photo</Label>
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                          {studentIdPreview ? (
                            <div className="space-y-4">
                                <img src={studentIdPreview || "/placeholder.svg"} alt="Student ID preview" className="max-w-full h-48 object-contain mx-auto rounded-lg" />
                              <div className="text-center">
                                  <Button variant="outline" onClick={() => { setStudentIdFile(null); setStudentIdPreview(""); }} disabled={submitting}>Remove</Button>
                                </div>
                            </div>
                          ) : (
                            <div className="text-center space-y-4">
                              <Camera className="h-12 w-12 text-muted-foreground mx-auto" />
                              <div>
                                <p className="text-sm font-medium">Upload your student ID</p>
                                <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                              </div>
                                <input type="file" accept="image/*" onChange={handleStudentIdUpload} className="hidden" id="student-id-upload" disabled={submitting} />
                              <label htmlFor="student-id-upload">
                                <Button variant="outline" className="cursor-pointer" disabled={submitting}>
                                    <Upload className="h-4 w-4 mr-2" />Choose File
                                </Button>
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                        {/* Selfie upload */}
                      <div className="space-y-2">
                          <Label>Selfie with Student ID</Label>
                          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                            {selfiePreview ? (
                              <div className="space-y-4">
                                <img src={selfiePreview || "/placeholder.svg"} alt="Selfie preview" className="max-w-full h-48 object-contain mx-auto rounded-lg" />
                                <div className="text-center">
                                  <Button variant="outline" onClick={() => { setSelfieFile(null); setSelfiePreview(""); }} disabled={submitting}>Remove</Button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center space-y-4">
                                <Camera className="h-12 w-12 text-muted-foreground mx-auto" />
                                <div>
                                  <p className="text-sm font-medium">Upload a selfie holding your student ID</p>
                                  <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                                </div>
                                <input type="file" accept="image/*" onChange={handleSelfieUpload} className="hidden" id="selfie-upload" disabled={submitting} />
                                <label htmlFor="selfie-upload">
                                  <Button variant="outline" className="cursor-pointer" disabled={submitting}>
                                    <Upload className="h-4 w-4 mr-2" />Choose File
                                  </Button>
                                </label>
                              </div>
                            )}
                          </div>
                      </div>
                      </>
                    ) : (
                      <>
                      <Alert>
                        <AlertDescription>
                            <b>Government ID Verification</b><br />
                            Please upload a clear photo of your government-issued ID (passport, national ID, or driver’s license). Make sure your name and photo are visible.<br />
                            <span className="text-xs text-muted-foreground">For extra security, also upload a selfie holding your ID.</span>
                        </AlertDescription>
                      </Alert>
                        {/* Government ID upload */}
                        <div className="space-y-2">
                          <Label>Government ID Photo</Label>
                          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                            {studentIdPreview ? (
                              <div className="space-y-4">
                                <img src={studentIdPreview || "/placeholder.svg"} alt="ID preview" className="max-w-full h-48 object-contain mx-auto rounded-lg" />
                                <div className="text-center">
                                  <Button variant="outline" onClick={() => { setStudentIdFile(null); setStudentIdPreview(""); }} disabled={submitting}>Remove</Button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center space-y-4">
                                <Camera className="h-12 w-12 text-muted-foreground mx-auto" />
                                <div>
                                  <p className="text-sm font-medium">Upload your government-issued ID</p>
                                  <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                                </div>
                                <input type="file" accept="image/*" onChange={handleStudentIdUpload} className="hidden" id="gov-id-upload" disabled={submitting} />
                                <label htmlFor="gov-id-upload">
                                  <Button variant="outline" className="cursor-pointer" disabled={submitting}>
                                    <Upload className="h-4 w-4 mr-2" />Choose File
                                  </Button>
                                </label>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Selfie upload */}
                        <div className="space-y-2">
                          <Label>Selfie with ID</Label>
                          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                            {selfiePreview ? (
                              <div className="space-y-4">
                                <img src={selfiePreview || "/placeholder.svg"} alt="Selfie preview" className="max-w-full h-48 object-contain mx-auto rounded-lg" />
                                <div className="text-center">
                                  <Button variant="outline" onClick={() => { setSelfieFile(null); setSelfiePreview(""); }} disabled={submitting}>Remove</Button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center space-y-4">
                                <Camera className="h-12 w-12 text-muted-foreground mx-auto" />
                                <div>
                                  <p className="text-sm font-medium">Upload a selfie holding your ID</p>
                                  <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                                </div>
                                <input type="file" accept="image/*" onChange={handleSelfieUpload} className="hidden" id="selfie-upload" disabled={submitting} />
                                <label htmlFor="selfie-upload">
                                  <Button variant="outline" className="cursor-pointer" disabled={submitting}>
                                    <Upload className="h-4 w-4 mr-2" />Choose File
                      </Button>
                                </label>
                              </div>
                            )}
                          </div>
                    </div>
                  </>
                    )}
                  </div>
                )}

                {/* Previous Requests */}
                {verificationRequests.filter((r) => r.verification_type === "student_id").length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Previous Requests</h4>
                    {verificationRequests
                      .filter((r) => r.verification_type === "student_id")
                      .map((request) => (
                        <Card key={request.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">
                                Submitted {new Date(request.submitted_at).toLocaleDateString()}
                              </p>
                              {request.reviewer_notes && (
                                <p className="text-xs text-muted-foreground mt-1">{request.reviewer_notes}</p>
                              )}
                            </div>
                            <Badge
                              variant={
                                request.status === "approved"
                                  ? "default"
                                  : request.status === "rejected"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {request.status}
                            </Badge>
                          </div>
                        </Card>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
