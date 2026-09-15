import { fetchUnapprovedForModeration } from '@/components/services/moderationSync';
import { useModeratorStorage } from '@/components/stores/moderatorStore';
import { useCallback, useEffect, useRef } from 'react';

export function useModerationSync() {
  const syncModerationQueues = useModeratorStorage((s) => s.syncModerationQueues);
  const setLoading = useModeratorStorage((s) => s.setLoading);
  const setError = useModeratorStorage((s) => s.setError);
  const inFlight = useRef(false);

  const sync = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setError(null);

    try {
      const snapshot = await fetchUnapprovedForModeration();
      syncModerationQueues(snapshot);
    } catch (err) {
      setError((err as Error)?.message ?? 'Moderation sync failed');
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, [syncModerationQueues, setLoading, setError]);

  useEffect(() => {
    sync();
  }, [sync]);

  return { sync };
}