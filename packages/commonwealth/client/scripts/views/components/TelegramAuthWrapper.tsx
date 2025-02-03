import { WalletSsoSource } from '@hicommonwealth/shared';
import React, { useEffect, useState } from 'react';
import { useAuthModalStore } from 'state/ui/modals';
import { z } from 'zod';
import { startLoginWithMagicLink } from '../../controllers/app/login';
import { AuthModalType } from '../modals/AuthModal/types';

// Validation schema for Telegram user data
const TelegramUserSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  language_code: z.string().optional(),
  photo_url: z.string().url().optional(),
});

// Validation schema for Telegram WebApp data
const TelegramWebAppSchema = z.object({
  initDataUnsafe: z.object({
    user: TelegramUserSchema.optional(),
    auth_date: z
      .union([z.string(), z.number()])
      .transform((val) => (typeof val === 'string' ? parseInt(val, 10) : val))
      .optional(),
    hash: z.string().optional(),
  }),
  isExpanded: z.boolean(),
  ready: z.function(),
  expand: z.function(),
});

// Extend Window interface to include Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp: z.infer<typeof TelegramWebAppSchema>;
    };
  }
}

// Debug overlay styles
const debugOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  padding: '10px',
  background: 'rgba(0, 0, 0, 0.8)',
  color: '#fff',
  fontFamily: 'monospace',
  fontSize: '12px',
  zIndex: 9999,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
};

/**
 * TelegramAuthWrapper - Handles Telegram's "fast auth" when the app is opened in Telegram
 *
 * This component:
 * 1. Detects if we're in a Telegram WebApp context
 * 2. Gets the pre-authenticated user data from Telegram
 * 3. Automatically triggers the auth flow with the user's data
 * 4. Shows the auth modal only if needed (e.g., for additional info or account linking)
 */
export const TelegramAuthWrapper = () => {
  const { setAuthModalType } = useAuthModalStore();
  const [debugInfo, setDebugInfo] = useState<{
    stage: string;
    error?: string;
    userData?: any;
    authFlow?: {
      step: string;
      details?: any;
      error?: string;
      logs?: Array<{
        timestamp: number;
        step: string;
        details?: any;
        error?: string;
      }>;
    };
  }>({ stage: 'Initializing...' });

  // Function to handle Telegram auth through Magic
  const handleTelegramAuth = async (
    userData: z.infer<typeof TelegramUserSchema>,
  ) => {
    try {
      setDebugInfo((prev) => ({
        ...prev,
        authFlow: {
          ...(prev.authFlow || {}),
          step: 'Starting Telegram auth via Magic',
          details: {
            userData,
            walletSsoSource: WalletSsoSource.Telegram,
          },
          logs: [
            ...(prev.authFlow?.logs || []),
            {
              timestamp: Date.now(),
              step: 'Starting Telegram auth via Magic',
              details: {
                userData,
                walletSsoSource: WalletSsoSource.Telegram,
              },
            },
          ],
        },
      }));

      // Store Telegram user data for Magic's OAuth callback
      sessionStorage.setItem(
        'telegram-user-data',
        JSON.stringify({
          username:
            userData.username ||
            `${userData.first_name}${userData.last_name ? ` ${userData.last_name}` : ''}`,
          avatarUrl: userData.photo_url,
          telegramId: userData.id,
        }),
      );

      // Start Magic OAuth flow for Telegram
      const { address } = await startLoginWithMagicLink({
        provider: WalletSsoSource.Telegram,
        isCosmos: false, // Telegram auth is always ETH-based
      });

      setDebugInfo((prev) => ({
        ...prev,
        authFlow: {
          ...(prev.authFlow || {}),
          step: 'Auth completed via Magic',
          details: { address },
          logs: [
            ...(prev.authFlow?.logs || []),
            {
              timestamp: Date.now(),
              step: 'Auth completed via Magic',
              details: { address },
            },
          ],
        },
      }));

      return { address };
    } catch (error) {
      const errorDetails = {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        raw: error,
      };

      setDebugInfo((prev) => ({
        ...prev,
        authFlow: {
          ...(prev.authFlow || {}),
          step: 'Auth failed',
          error: errorDetails.message,
          details: errorDetails,
          logs: [
            ...(prev.authFlow?.logs || []),
            {
              timestamp: Date.now(),
              step: 'Auth failed',
              error: errorDetails.message,
              details: errorDetails,
            },
          ],
        },
      }));
      throw error;
    }
  };

  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1 second

    const initTelegramAuth = async () => {
      if (!window.Telegram?.WebApp) {
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          setDebugInfo((prev) => ({
            ...prev,
            stage: `Waiting for WebApp (attempt ${retryCount}/${MAX_RETRIES})`,
          }));
          setTimeout(initTelegramAuth, RETRY_DELAY);
          return;
        }
        setDebugInfo({
          stage: 'Not in Telegram WebApp context',
          error: 'window.Telegram.WebApp is not available after retries',
        });
        return;
      }

      try {
        // Initialize Telegram WebApp
        window.Telegram.WebApp.ready();
        if (!mounted) return;
        setDebugInfo({ stage: 'WebApp Ready' });

        // Expand to full height if not already expanded
        if (!window.Telegram.WebApp.isExpanded) {
          window.Telegram.WebApp.expand();
          if (!mounted) return;
          setDebugInfo({ stage: 'WebApp Expanded' });
        }

        // Validate WebApp structure and get user data
        const webAppResult = TelegramWebAppSchema.safeParse(
          window.Telegram.WebApp,
        );
        if (!webAppResult.success) {
          setDebugInfo({
            stage: 'WebApp Validation Failed',
            error: JSON.stringify(webAppResult.error.issues, null, 2),
          });
          return;
        }

        const userData = webAppResult.data.initDataUnsafe.user;
        if (!userData) {
          setDebugInfo({
            stage: 'No User Data',
            error: 'User data not available in WebApp',
          });
          return;
        }

        // Validate user data from Telegram
        const userDataResult = TelegramUserSchema.safeParse(userData);
        if (!userDataResult.success) {
          setDebugInfo({
            stage: 'User Data Validation Failed',
            error: JSON.stringify(userDataResult.error.issues, null, 2),
          });
          return;
        }

        // Store the validated user data for the auth flow
        const validatedUserData = userDataResult.data;
        sessionStorage.setItem(
          'telegram-auth-data',
          JSON.stringify(validatedUserData),
        );

        if (!mounted) return;
        setDebugInfo({
          stage: 'Auth Flow Started',
          userData: validatedUserData,
          authFlow: {
            step: 'Starting Telegram auth',
            details: {
              walletSsoSource: WalletSsoSource.Telegram,
              userData: validatedUserData,
            },
          },
        });

        try {
          // Attempt direct Telegram auth
          await handleTelegramAuth(validatedUserData);
        } catch (error) {
          if (!mounted) return;
          setDebugInfo((prev) => ({
            ...prev,
            authFlow: {
              step: 'Auth failed',
              error: error instanceof Error ? error.message : String(error),
            },
          }));

          // If direct auth fails, show the auth modal
          setAuthModalType(AuthModalType.SignIn);
        }
      } catch (error) {
        if (!mounted) return;
        setDebugInfo((prev) => ({
          ...prev,
          stage: 'Error',
          error: error instanceof Error ? error.message : String(error),
        }));
      }
    };

    initTelegramAuth();

    return () => {
      mounted = false;
    };
  }, [setAuthModalType]);

  // Only render debug overlay in development and for specific users
  if (process.env.NODE_ENV === 'development') {
    return (
      <div style={debugOverlayStyle}>
        <div>Stage: {debugInfo.stage}</div>
        {debugInfo.error && (
          <div style={{ color: '#ff6b6b' }}>Error: {debugInfo.error}</div>
        )}
        {debugInfo.userData && (
          <div style={{ color: '#69db7c' }}>
            User Data: {JSON.stringify(debugInfo.userData, null, 2)}
          </div>
        )}
        {debugInfo.authFlow && (
          <div style={{ color: '#ffd43b' }}>
            Auth Flow:
            <div>Current Step: {debugInfo.authFlow.step}</div>
            {debugInfo.authFlow.details && (
              <div>
                Current Details:{' '}
                {JSON.stringify(debugInfo.authFlow.details, null, 2)}
              </div>
            )}
            {debugInfo.authFlow.error && (
              <div style={{ color: '#ff6b6b' }}>
                Current Error: {debugInfo.authFlow.error}
              </div>
            )}
            {debugInfo.authFlow.logs && debugInfo.authFlow.logs.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <div>History:</div>
                {debugInfo.authFlow.logs.map((log, i) => (
                  <div
                    key={i}
                    style={{
                      marginLeft: '10px',
                      marginTop: '5px',
                      fontSize: '11px',
                    }}
                  >
                    <div>[{new Date(log.timestamp).toISOString()}]</div>
                    <div>Step: {log.step}</div>
                    {log.details && (
                      <div>Details: {JSON.stringify(log.details, null, 2)}</div>
                    )}
                    {log.error && (
                      <div style={{ color: '#ff6b6b' }}>Error: {log.error}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default TelegramAuthWrapper;
