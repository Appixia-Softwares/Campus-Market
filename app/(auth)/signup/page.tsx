"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { BookOpen, Eye, EyeOff, Lock, Mail, User, Loader2, ChevronRight, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { signUp } from '@/lib/auth-service';
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import ZIM_UNIVERSITIES from "@/utils/schools_data"
import { Textarea } from "@/components/ui/textarea"

interface University {
  id: string
  name: string
  location: string
}

type Step = {
  id: number
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    id: 1,
    title: "Personal Information",
    description: "Tell us about yourself",
  },
  {
    id: 2,
    title: "University",
    description: "Select your university",
  },
  {
    id: 3,
    title: "Security",
    description: "Set up your password",
  },
  {
    id: 4,
    title: "Terms",
    description: "Review and accept terms",
  },
]

interface SignUpError {
  message: string
  code?: string
  details?: string
  hint?: string
}

// Add user type options
const USER_TYPES = [
  { id: 'student', label: 'Student' },
  { id: 'non_student', label: 'Non-Student' },
];

interface SignUpFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  university: string;
  studentId: string;
  phone: string;
  yearOfStudy: string;
  course: string;
  userType: 'student' | 'non_student';
  occupation?: string;
  organization?: string;
  reason?: string;
}


export default function SignupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [universities, setUniversities] = useState<University[]>([])
  const [isLoadingUniversities, setIsLoadingUniversities] = useState(true)
  const [formData, setFormData] = useState<SignUpFormData>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    university: "",
    studentId: "",
    phone: "",
    yearOfStudy: "",
    course: "",
    userType: 'student',
    occupation: "",
    organization: "",
    reason: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [phoneError, setPhoneError] = useState("");

  useEffect(() => {
    async function loadUniversities() {
      setIsLoadingUniversities(true)
      try {
        // Group and sort universities by type and name
        const grouped: { [type: string]: University[] } = {};
        ZIM_UNIVERSITIES.forEach(u => {
          if (!grouped[u.type || 'other']) grouped[u.type || 'other'] = [];
          grouped[u.type || 'other'].push(u);
        });
        Object.keys(grouped).forEach(type => {
          grouped[type].sort((a, b) => a.name.localeCompare(b.name));
        });
        // Flatten to a list with type markers
        const sortedWithHeadings: (University & { _heading?: boolean })[] = [];
        const typeLabels: { [type: string]: string } = {
          university: 'Universities',
          polytechnic: 'Polytechnics',
          teachers_college: 'Teacher Training Colleges',
          adult_education: 'Adult Education & Training',
          vocational: 'Vocational Training Centers',
          industrial_training: 'Industrial Training Centers',
          agricultural: 'Agricultural Training Centers',
          health_training: 'Health Training Institutions',
          business_training: 'Business & Management Training',
          religious: 'Religious Training Institutions',
          adult_literacy: 'Adult Literacy Centers',
          other: 'Other',
        };
        Object.keys(typeLabels).forEach(type => {
          if (grouped[type] && grouped[type].length > 0) {
            sortedWithHeadings.push({ id: type, name: typeLabels[type], location: '', _heading: true });
            sortedWithHeadings.push(...grouped[type]);
          }
        });
        setUniversities(sortedWithHeadings as University[]);
      } catch (err) {
        console.error("Debug - Unexpected error loading universities:", err)
      } finally {
        setIsLoadingUniversities(false)
      }
    }
    loadUniversities()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    // Real-time phone validation
    if (name === "phone") {
      // Only allow digits, max 9
      const digits = value.replace(/\D/g, "").slice(0, 9);
      setFormData((prev) => ({ ...prev, phone: digits }));
      // Live error
      if (!digits) {
        setPhoneError("Phone number is required");
      } else if (digits.length !== 9) {
        setPhoneError("Phone number must be exactly 9 digits");
      } else {
        setPhoneError("");
      }
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Add this handler for textarea fields
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (!agreeToTerms) {
      setError("You must agree to the terms and conditions")
      setIsLoading(false)
      return
    }

    // Validate required fields based on user type
    if (formData.userType === 'student') {
      if (!formData.university) {
        setError("Please select your university")
        setIsLoading(false)
        return
      }
      if (!formData.studentId) {
        setError("Please enter your student ID")
        setIsLoading(false)
        return
      }
    }
    // Phone validation (required, numeric, exactly 9 digits)
    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (!phoneDigits) {
      setError("Phone number is required")
      setIsLoading(false)
      return
    }
    if (phoneDigits.length !== 9) {
      setError("Phone number must be exactly 9 digits (e.g., 771234567)")
      setIsLoading(false)
      return
    }
    // ... rest of validation for non-students
    if (formData.userType !== 'student') {
      if (!formData.occupation || !formData.organization || !formData.reason) {
        setError("Please fill in all required fields for non-students")
        setIsLoading(false)
        return
      }
    }

    try {
      // Use modular signUp helper from auth-service
      // Ensure phone is always saved with +263 country code
      const cleanPhone = formData.phone.replace(/\s/g, "").replace(/^\+263|^263|^0/, "");
      const phoneWithCode = cleanPhone ? `+263${cleanPhone}` : undefined;
      await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        university_id: formData.university,
        student_id: formData.studentId,
        phone: phoneWithCode,
        whatsapp_number: phoneWithCode,
        course: formData.course,
        year_of_study: formData.yearOfStudy,
        role: formData.userType,
        occupation: formData.occupation,
        organization: formData.organization,
        reason: formData.reason,
      })
      toast({
        title: "Account created!",
        description: "Please check your email to confirm your account.",
        variant: "default",
      })
      router.push("/login?message=Please check your email to confirm your account")
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            {/* User Type Selector */}
            <div className="space-y-2">
              <Label>User Type</Label>
              <div className="flex gap-4">
                {USER_TYPES.map((type) => (
                  <Button
                    key={type.id}
                    type="button"
                    variant={formData.userType === type.id ? "default" : "outline"}
                    className={`px-6 py-2 rounded-full font-semibold transition-colors duration-150 ${formData.userType === type.id ? 'bg-green-600 text-white' : 'bg-white text-green-700 border-green-600 hover:bg-green-50'}`}
                    onClick={() => setFormData((prev) => ({ ...prev, userType: type.id as 'student' | 'non_student' }))}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>
            {/* Student/Non-Student Fields */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="John Doe"
                  className="pl-10"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your.email@example.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            {/* Advanced fields for non-students */}
            {formData.userType === 'non_student' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input
                    id="occupation"
                    name="occupation"
                    placeholder="e.g., Lecturer, Entrepreneur"
                    value={formData.occupation}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization</Label>
                  <Input
                    id="organization"
                    name="organization"
                    placeholder="e.g., University of Zimbabwe, Company Name"
                    value={formData.organization}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Joining</Label>
                  <Textarea
                    id="reason"
                    name="reason"
                    placeholder="Tell us why you want to join Campus Market..."
                    value={formData.reason}
                    onChange={handleTextareaChange}
                    disabled={isLoading}
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>
        )
      case 2:
        // Only show student fields if userType is 'student'
        if (formData.userType === 'student') {
          return (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="university">University</Label>
                <Select
                  value={formData.university}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, university: value }))}
                  disabled={isLoading || isLoadingUniversities}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={isLoadingUniversities ? "Loading universities..." : "Select your university"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {universities.map((university) =>
                      (university as any)._heading ? (
                        <SelectItem key={university.id} value={university.id} disabled className="font-bold opacity-70 bg-muted">
                          {(university as any).name}
                        </SelectItem>
                      ) : (
                        <SelectItem key={university.id} value={university.id}>
                          <div className="flex flex-col">
                            <span>{university.name}</span>
                            <span className="text-xs text-muted-foreground">{university.location}</span>
                          </div>
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentId">Student ID</Label>
                <Input
                  id="studentId"
                  name="studentId"
                  placeholder="e.g., H230001A"
                  value={formData.studentId}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="course">Course/Program</Label>
                <Input
                  id="course"
                  name="course"
                  placeholder="e.g., Computer Science"
                  value={formData.course}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearOfStudy">Year of Study</Label>
                <Select
                  value={formData.yearOfStudy}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, yearOfStudy: value }))}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1st Year</SelectItem>
                    <SelectItem value="2">2nd Year</SelectItem>
                    <SelectItem value="3">3rd Year</SelectItem>
                    <SelectItem value="4">4th Year</SelectItem>
                    <SelectItem value="5">5th Year</SelectItem>
                    <SelectItem value="postgrad">Postgraduate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )
        } else {
          // For non-students, skip this step
          nextStep();
          return null;
        }
      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-muted">
                  <span className="text-lg">🇿🇼</span>
                  <span className="font-medium">+263</span>
                </div>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="77 123 4567"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="flex-1"
                  maxLength={9}
                />
              </div>
              {phoneError && (
                <p className="text-xs text-red-600 mt-1">{phoneError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className="pl-10 pr-10"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Password must be at least 8 characters long</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  className="pl-10 pr-10"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>
        )
      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                disabled={isLoading}
              />
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I agree to the{" "}
                <Link
                  href="/terms"
                  className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                >
                  terms of service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                >
                  privacy policy
                </Link>
              </label>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  const isPhoneValid = !phoneError && formData.phone.length === 9;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4">
        <div className="container flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
            <span className="text-xl font-bold">Campus Market</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-md">
          <Card className="border-green-200 dark:border-green-800 shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">{STEPS[currentStep - 1].title}</CardTitle>
              <CardDescription className="text-center">{STEPS[currentStep - 1].description}</CardDescription>
              <Progress value={(currentStep / STEPS.length) * 100} className="mt-4" />
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSignup} className="space-y-4">
                {renderStep()}

                <div className="flex justify-between pt-4">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      disabled={isLoading}
                      className="flex items-center"
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>
                  )}
                  {currentStep < STEPS.length ? (
                    <Button type="button" onClick={nextStep} disabled={isLoading || (currentStep === 3 && !isPhoneValid)} className="ml-auto flex items-center">
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className="ml-auto bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
                      disabled={isLoading || !isPhoneValid}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create account"
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium"
                >
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  )
}
