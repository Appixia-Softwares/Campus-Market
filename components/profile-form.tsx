import React, { useMemo, useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { getUniversities } from "@/lib/get-universities";
import ZIM_UNIVERSITIES from "@/utils/schools_data";
import { ProfileFormValues } from "@/types";

interface ProfileFormProps {
  onSubmit?: (values: ProfileFormValues) => void;
}

// --- ProfileForm: Modular, DRY, and ready for modal/bottom sheet use ---
// --- All fields are prefilled, validated, and mapped to Firestore/user object keys ---

// --- Zod schema: all fields are required and defaulted to empty string if missing ---
const formSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email(),
  phone: z.string().regex(/^\+263\d{9}$/, "Phone must be in +263 format (e.g. +263771234567)"),
  profilePhoto: z.string(),
  bio: z.string(),
  location: z.string(),
  contactMethod: z.string(),
  userType: z.enum(["student", "non_student"]),
  university_id: z.string(),
  studentId: z.string(),
  course: z.string(),
  yearOfStudy: z.string(),
  occupation: z.string(),
  organization: z.string(),
  reason: z.string(),
});

export default function ProfileForm({ onSubmit: onSubmitProp }: ProfileFormProps) {
  const { user } = useAuth();
  if (!user) return null;
  // --- Ensure defaultValues always provides a string for every field ---
  const defaultValues: ProfileFormValues = useMemo(() => ({
    fullName: user.full_name || "",
    email: user.email || "",
    phone: user.phone || "",
    profilePhoto: user.avatar_url || "",
    bio: "",
    location: "",
    contactMethod: "",
    userType: user.role === 'student' || user.role === 'non_student' ? user.role : 'student',
    university_id: user.university_id || "",
    studentId: user.student_id || "",
    course: user.course || "",
    yearOfStudy: user.year_of_study || "",
    occupation: user.occupation || "",
    organization: user.organization || "",
    reason: user.reason || "",
  }), [user]);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onChange",
  });

  const [universities, setUniversities] = useState([]);
  useEffect(() => {
    async function loadUnis() {
      const unis = await getUniversities();
      setUniversities(unis.filter(u => u.type === "university" && u.is_active !== false));
    }
    loadUnis();
  }, []);

  // Calculate profile completion progress
  const requiredFields: (keyof ProfileFormValues)[] = ["fullName", "email"];
  if (form.watch("userType") === "student") {
    requiredFields.push("university_id", "studentId", "course", "yearOfStudy");
  } else {
    requiredFields.push("occupation", "organization", "reason");
  }
  const progress = Math.round(
    (requiredFields.filter((field) => form.watch(field)).length / requiredFields.length) * 100
  );

  const onSubmit: SubmitHandler<ProfileFormValues> = (values) => {
    if (onSubmitProp) onSubmitProp(values);
  };

  // --- Helper: Live phone validation feedback ---
  const phoneValue = form.watch("phone");
  const phoneValid = phoneValue === "" || /^\+263\d{9}$/.test(phoneValue);

  return (
    <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6">
        <div className="flex flex-col items-center mb-6">
              <Avatar className="h-24 w-24">
            <AvatarImage src={form.watch("profilePhoto") || "/placeholder-user.jpg"} alt="Profile" />
            <AvatarFallback>{(form.watch("fullName") && typeof form.watch("fullName") === 'string') ? form.watch("fullName").charAt(0) : "U"}</AvatarFallback>
              </Avatar>
              </div>
        <Progress value={progress} className="mb-6" />
              <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                      <Input {...field} readOnly />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                    <FormLabel>Phone <span className="text-muted-foreground">(Format: +263771234567)</span></FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    {!phoneValid && (
                      <div className="text-xs text-destructive">Phone must be in +263 format (e.g. +263771234567)</div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Contact Method (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Email, Phone, WhatsApp, etc." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio (optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Tell us about yourself..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Student fields: Only show if userType is student */}
            {form.watch("userType") === "student" ? (
              <div className="grid gap-4 md:grid-cols-2">
                {/* University dropdown uses static, grouped, sorted list */}
                <FormField
                  control={form.control}
                  name="university_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>University/Institution <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <select {...field} className="input">
                          <option value="">Select your university</option>
                          {universities.map(u => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.location})
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student ID <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                  name="course"
                      render={({ field }) => (
                        <FormItem>
                      <FormLabel>Course/Program <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                  name="yearOfStudy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year of Study <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              // Non-student fields
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="occupation"
                      render={({ field }) => (
                    <FormItem>
                      <FormLabel>Occupation <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                  name="organization"
                      render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization/Company <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for Joining <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Tell us why you want to join..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
            )}
            <div className="flex justify-end pt-4">
                    <Button type="submit">Save Changes</Button>
                  </div>
                </form>
              </Form>
        </CardContent>
      </Card>
  );
}
