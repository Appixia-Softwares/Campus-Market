'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function MigrateButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleMigrate = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/migrate', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Migration and seeding completed successfully!');
      } else {
        toast.error(`Migration failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      toast.error('Failed to migrate data. Please try again.');
      console.error('Migration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleMigrate}
      disabled={isLoading}
      variant="destructive"
      className="w-full"
    >
      {isLoading ? 'Migrating...' : 'Migrate & Seed Data'}
    </Button>
  );
} 