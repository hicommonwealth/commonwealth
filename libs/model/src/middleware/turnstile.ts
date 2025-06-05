import {
  Context,
  InvalidActor,
  InvalidInput,
  logger,
} from '@hicommonwealth/core';
import { TurnstileWidgetNames, UserTierMap } from '@hicommonwealth/shared';
import { ZodType } from 'zod/v4';
import { config } from '../config';
import { models } from '../database';

const log = logger(import.meta);

async function verifyTurnstile(token: string, secret: string) {
  log.trace('Verifying turnstile token', { token, secret });
  try {
    const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret,
        response: token,
        // TODO: remoteip
      }),
    });
    const data = await response.json();
    return data.success;
  } catch (error) {
    error instanceof Error
      ? log.error('Failed to verify turnstile token', error)
      : log.error('Failed to verify turnstile token', undefined, {
          error: JSON.stringify(error),
        });

    return false;
  }
}

const TurnstileSecretMap: Record<TurnstileWidgetNames, string | undefined> = {
  'create-community': config.CLOUDFLARE.TURNSTILE.CREATE_COMMUNITY?.SECRET_KEY,
  'create-thread': config.CLOUDFLARE.TURNSTILE.CREATE_THREAD?.SECRET_KEY,
  'create-comment': config.CLOUDFLARE.TURNSTILE.CREATE_COMMENT?.SECRET_KEY,
};

export function turnstile({
  widgetName,
  bypassMinTier = UserTierMap.SocialVerified,
}: {
  widgetName: TurnstileWidgetNames;
  bypassMinTier?: number;
}) {
  return async function ({ actor, payload }: Context<ZodType, ZodType>) {
    const turnstileSiteKey = TurnstileSecretMap[widgetName];
    if (config.APP_ENV === 'production' && !turnstileSiteKey)
      throw new Error('Turnstile site key not found');
    if (!turnstileSiteKey) {
      log.trace('Turnstile disabled', {
        widgetName,
      });
      return;
    }

    const user = await models.User.findOne({
      where: {
        id: actor.user.id,
      },
    });
    if (!user) throw new InvalidActor(actor, 'User not found');
    if (user.tier >= bypassMinTier) {
      log.trace('Turnstile bypassed', {
        userTier: user.tier,
        minTier: bypassMinTier,
      });
      return;
    }

    if (!payload.turnstile_token) {
      throw new InvalidInput('Turnstile token is required');
    }

    const verified = await verifyTurnstile(
      payload.turnstile_token,
      turnstileSiteKey,
    );
    log.trace('Turnstile verification', { verified });
    if (!verified) throw new InvalidActor(actor, 'Invalid turnstile token');
  };
}
