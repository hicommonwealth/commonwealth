import { TurnstileWidgetNames, UserTierMap } from '@hicommonwealth/shared';
import { notifyError } from 'client/scripts/controllers/app/notifications';
import React, { useCallback, useState } from 'react';
import Turnstile, { useTurnstile as useReactTurnstile } from 'react-turnstile';
import useFetchPublicEnvVarQuery from 'state/api/configuration/fetchPublicEnvVar';
import { useDarkMode } from 'state/ui/darkMode/darkMode';
import useUserStore from 'state/ui/user';

interface UseTurnstileOptions {
  action: TurnstileWidgetNames;
  onVerify?: (token: string) => void;
  onExpire?: () => void;
  onError?: (error?: string) => void;
  size?: 'normal' | 'compact';
  appearance?: 'always' | 'interaction-only' | 'execute';
}

interface UseTurnstileResult {
  turnstileToken: string | null;
  setTurnstileToken: (token: string | null) => void;
  resetTurnstile: () => void;
  isTurnstileEnabled: boolean;
  TurnstileWidget: React.FC;
}

/**
 * A custom hook for managing Cloudflare Turnstile verification
 *
 * @param options Configuration options for Turnstile
 * @returns Turnstile state and components
 */
export const useTurnstile = (
  options: UseTurnstileOptions,
): UseTurnstileResult => {
  const {
    action,
    onVerify: externalOnVerify,
    onExpire: externalOnExpire,
    onError: externalOnError,
    size = 'normal',
    appearance = 'interaction-only',
  } = options;

  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstile = useReactTurnstile();
  const { isDarkMode } = useDarkMode();
  const user = useUserStore();

  const { data: configurationData } = useFetchPublicEnvVarQuery();

  const siteKey =
    action === 'create-thread'
      ? configurationData!.CF_TURNSTILE_CREATE_THREAD_SITE_KEY
      : action === 'create-comment'
        ? configurationData!.CF_TURNSTILE_CREATE_COMMENT_SITE_KEY
        : configurationData!.CF_TURNSTILE_CREATE_COMMUNITY_SITE_KEY;

  // Determine if Turnstile should be enabled based on site key and user tier
  const isTurnstileEnabled =
    !!siteKey && (user.tier || 0) < UserTierMap.SocialVerified;

  // Reset the Turnstile widget
  const resetTurnstile = useCallback(() => {
    turnstile.reset();
    setTurnstileToken(null);
  }, [turnstile]);

  // Handle successful verification
  const handleVerify = useCallback(
    (token: string) => {
      console.log(`Turnstile verified${action ? ` for ${action}` : ''}`);
      setTurnstileToken(token);
      externalOnVerify?.(token);
    },
    [externalOnVerify, action],
  );

  // Handle token expiration
  const handleExpire = useCallback(() => {
    console.log(`Turnstile expired${action ? ` for ${action}` : ''}`);
    setTurnstileToken(null);
    turnstile.reset();
    externalOnExpire?.();
  }, [turnstile, externalOnExpire, action]);

  // Handle verification errors
  const handleError = useCallback(
    (error?: string) => {
      setTurnstileToken(null);
      notifyError(error || 'Verification failed. Please try again.');
      externalOnError?.(error);
    },
    [externalOnError],
  );

  // Turnstile component that can be rendered where needed
  const TurnstileWidget: React.FC = useCallback(() => {
    if (!isTurnstileEnabled) return null;

    if (!siteKey) {
      console.warn('Turnstile site key disabled');
      return null;
    }

    return (
      <div className="turnstile-container">
        <Turnstile
          sitekey={siteKey}
          onVerify={handleVerify}
          onExpire={handleExpire}
          onError={handleError}
          appearance={appearance}
          theme={isDarkMode ? 'dark' : 'light'}
          fixedSize={false}
          size={size}
        />
      </div>
    );
  }, [
    isTurnstileEnabled,
    siteKey,
    handleVerify,
    handleExpire,
    handleError,
    appearance,
    isDarkMode,
    size,
  ]);

  if (!siteKey) {
    return {
      turnstileToken: null,
      setTurnstileToken: () => {},
      resetTurnstile: () => {},
      isTurnstileEnabled: false,
      TurnstileWidget: () => <></>,
    };
  } else {
    return {
      turnstileToken,
      setTurnstileToken,
      resetTurnstile,
      isTurnstileEnabled,
      TurnstileWidget,
    };
  }
};

export default useTurnstile;
