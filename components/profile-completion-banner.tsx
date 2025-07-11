import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface ProfileCompletionBannerProps {
  progress: number;
  onEditProfile: () => void;
}

export function ProfileCompletionBanner({ progress, onEditProfile }: ProfileCompletionBannerProps) {
  return (
    <Card className="mb-6 bg-gradient-to-r from-green-100 to-green-50 border-green-200">
      <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4 p-6">
        <div>
          <h3 className="text-lg font-semibold mb-1">Complete your profile</h3>
          <p className="text-muted-foreground mb-2">Build trust and unlock all features by completing your profile.</p>
          <Progress value={progress} className="h-2 w-48" />
          <span className="text-xs text-muted-foreground mt-1 block">{progress}% complete</span>
        </div>
        <Button onClick={onEditProfile} className="mt-4 md:mt-0">Edit Profile</Button>
      </CardContent>
    </Card>
  );
} 