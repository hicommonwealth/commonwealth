import { useCallback, useEffect, useRef, useState } from 'react';
import { clientAnalyticsTrack } from '../../../shared/analytics/client-track';
import { AnalyticsPayload } from '../../../shared/analytics/types';

export function useBrowserAnalyticsTrack({
  payload,
  onAction = false,
}: {
  payload?: AnalyticsPayload;
  onAction?: boolean;
}) {
  const hasFiredRef = useRef(false);

  // Fire once on component mount
  useEffect(() => {
    if (!onAction && payload && !hasFiredRef.current) {
      try {
        clientAnalyticsTrack(payload);
        hasFiredRef.current = true;
      } catch (e) {
        console.log('Failed to track event:', e.message);
      }
    }
  }, [onAction, payload]);

  // Fire on action
  const trackAnalytics = useCallback(
    (actionPayload: AnalyticsPayload) => {
      if (onAction) {
        try {
          clientAnalyticsTrack(actionPayload);
        } catch (e) {
          console.log('Failed to track event:', e.message);
        }
      }
    },
    [onAction]
  );

  return { trackAnalytics };
}
