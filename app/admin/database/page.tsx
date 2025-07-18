"use client";

import { DatabaseStatus } from "@/components/database-status";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function AdminDatabasePage() {
  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle>Database Tools & Status</CardTitle>
          <CardDescription>
            View the current status of key database collections and perform admin database actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DatabaseStatus />
        </CardContent>
      </Card>
    </div>
  );
} 