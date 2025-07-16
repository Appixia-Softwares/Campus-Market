import { useEffect, useState } from "react";
import { listenToSettings } from "@/lib/api/settings";

export function useFeatureFlags() {
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = listenToSettings((data) => {
      setFeatureFlags(data.featureFlags || {});
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { featureFlags, loading };
} 