import { useCallback, useEffect, useRef, useState } from 'react';
import { clientAnalyticsTrack } from '../../../shared/analytics/client-track';
import { AnalyticsPayload } from '../../../shared/analytics/types';
import app from 'state';

/**
 * Hook to capture analytics events on the browser
 * @param payload Formatted analytics payload
 * @param onAction whether to fire on action or on component mount
 * @returns trackAnalytics function to fire analytics event
 */
export function useBrowserAnalyticsTrack<T extends AnalyticsPayload>({
  payload,
  onAction = false,
}: {
  payload?: T;
  onAction?: boolean;
}) {
  const hasFiredRef = useRef(false);

  // Fire once on component mount
  useEffect(() => {
    if (!onAction && payload && !hasFiredRef.current) {
      try {
        clientAnalyticsTrack({
          ...payload,
          userAddress: app.user?.activeAccount?.address ?? null,
        });
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
          clientAnalyticsTrack({
            ...actionPayload,
          });
        } catch (e) {
          console.log('Failed to track event:', e.message);
        }
      }
    },
    [onAction]
  );

  return { trackAnalytics };
}
