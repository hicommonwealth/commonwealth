import moment from 'moment';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@hicommonwealth/shared', () => ({
  COMMUNITY_NAME_ERROR: 'Invalid community name',
  COMMUNITY_NAME_REGEX: /^[a-zA-Z0-9 _-]+$/,
}));

import {
  APIOrderBy,
  APIOrderDirection,
  BASE_CHAIN_ID,
  DEFAULT_CHAIN,
  twitterLinkRegex,
} from '../../../client/scripts/helpers/constants';
import { getRelativeTimestamp } from '../../../client/scripts/helpers/dates';
import {
  formatDisplayNumber,
  formatMarketCap,
} from '../../../client/scripts/helpers/formatting';
import {
  linkValidationSchema,
  numberValidationSchema,
} from '../../../client/scripts/helpers/formValidations/common';
import { VALIDATION_MESSAGES } from '../../../client/scripts/helpers/formValidations/messages';
import {
  categorizeSocialLinks,
  getLinkType,
  isLinkValid,
} from '../../../client/scripts/helpers/link';

describe('shared infrastructure utility contracts', () => {
  test('constants expose stable baseline values', () => {
    expect(APIOrderDirection.Asc).toBe('ASC');
    expect(APIOrderBy.LastActive).toBe('last_active');
    expect(DEFAULT_CHAIN).toBe('edgeware');
    expect(BASE_CHAIN_ID).toBe(8453);
  });

  test('twitter status regex continues matching status URLs', () => {
    const match = 'https://twitter.com/commonxyz/status/123456789'.match(
      twitterLinkRegex,
    );
    expect(match?.[1]).toBe('123456789');
  });

  test('formatting helpers preserve number formatting contracts', () => {
    expect(formatDisplayNumber(null)).toBe('N/A');
    expect(formatDisplayNumber(1530, { decimals: 1 })).toBe('1.5k');
    expect(
      formatDisplayNumber(12.3, { decimals: 2, currencySymbol: '$' }),
    ).toBe('$12.30');
    expect(formatMarketCap(1800, '$', 1)).toBe('$1.8k');
    expect(formatMarketCap('invalid')).toBe('N/A');
  });

  test('relative timestamp helper returns expected granularity', () => {
    const timestamp = moment().subtract(2, 'hours').toISOString();
    expect(getRelativeTimestamp(timestamp)).toBe('2 hours ago');
  });

  test('link helpers correctly validate, classify, and categorize links', () => {
    expect(isLinkValid('https://github.com/hicommonwealth/commonwealth')).toBe(
      true,
    );
    expect(isLinkValid('not-a-url')).toBe(false);
    expect(getLinkType('https://x.com/commonxyz')).toBe('x (twitter)');
    expect(getLinkType('https://discord.gg/commonxyz')).toBe('discord');

    const categorized = categorizeSocialLinks([
      'https://github.com/hicommonwealth/commonwealth',
      'https://discord.gg/commonxyz',
      'https://example.com',
    ]);

    expect(categorized.githubs).toHaveLength(1);
    expect(categorized.discords).toHaveLength(1);
    expect(categorized.remainingLinks).toEqual(['https://example.com']);
  });

  test('form validation schemas keep expected parsing behavior', () => {
    expect(
      linkValidationSchema.required.safeParse('https://example.com').success,
    ).toBe(true);
    expect(linkValidationSchema.optional.safeParse('').success).toBe(true);
    expect(numberValidationSchema.required.safeParse('123').success).toBe(true);
    expect(numberValidationSchema.required.safeParse('12.3').success).toBe(
      false,
    );
  });

  test('validation messages remain stable', () => {
    expect(VALIDATION_MESSAGES.MUST_BE_GREATER(5)).toBe(
      'Must be greater than 5',
    );
    expect(VALIDATION_MESSAGES.GITHUB_FORMAT).toBe('Invalid GitHub URL');
  });
});
