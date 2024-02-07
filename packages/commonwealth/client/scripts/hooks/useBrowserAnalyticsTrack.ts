import { useCallback, useEffect, useRef } from 'react';
import app from 'state';
import { clientAnalyticsTrack } from '../../../shared/analytics/client-track';
import { AnalyticsPayload } from '../../../shared/analytics/types';

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
          // use active account if available; otherwise, use one of user's addresses
          userAddress:
            (app.user?.activeAccount?.address ||
              app.user?.addresses[0]?.address) ??
            null,
          community: app.activeChainId(),
        });
        hasFiredRef.current = true;
      } catch (e) {
        console.log('Failed to track event:', e.message);
      }
    }
  }, [onAction, payload]);

  // Fire on action
  const trackAnalytics = useCallback(
    (actionPayload: T) => {
      if (onAction) {
        try {
          clientAnalyticsTrack({
            ...actionPayload,
            userAddress: app.user?.activeAccount?.address ?? null,
            community: app.activeChainId(),
          });
        } catch (e) {
          console.log('Failed to track event:', e.message);
        }
      }
    },
    [onAction],
  );

  return { trackAnalytics };
}
