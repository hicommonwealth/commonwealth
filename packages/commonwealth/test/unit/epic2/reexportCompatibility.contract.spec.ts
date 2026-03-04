import { describe, expect, test } from 'vitest';

type ModuleContract = {
  legacySpecifier: string;
  futureSpecifiers: string[];
  requiredExports: string[];
};

const contracts: ModuleContract[] = [
  {
    legacySpecifier: '../../../client/scripts/helpers/constants.ts',
    futureSpecifiers: ['../../../client/scripts/shared/utils/constants.ts'],
    requiredExports: ['twitterLinkRegex', 'APIOrderBy', 'APIOrderDirection'],
  },
  {
    legacySpecifier: '../../../client/scripts/helpers/formatting.ts',
    futureSpecifiers: ['../../../client/scripts/shared/utils/formatting.ts'],
    requiredExports: ['formatDisplayNumber', 'formatMarketCap'],
  },
  {
    legacySpecifier: '../../../client/scripts/helpers/dates.ts',
    futureSpecifiers: ['../../../client/scripts/shared/utils/dates.ts'],
    requiredExports: ['getRelativeTimestamp'],
  },
  {
    legacySpecifier: '../../../client/scripts/helpers/link.ts',
    futureSpecifiers: ['../../../client/scripts/shared/utils/link.ts'],
    requiredExports: ['isLinkValid', 'getLinkType', 'categorizeSocialLinks'],
  },
  {
    legacySpecifier: '../../../client/scripts/helpers/currency.ts',
    futureSpecifiers: ['../../../client/scripts/shared/utils/currency.ts'],
    requiredExports: [
      'SupportedFiatCurrencies',
      'SupportedCryptoCurrencies',
      'getAmountWithCurrencySymbol',
    ],
  },
  {
    legacySpecifier: '../../../client/scripts/helpers/typeGuards.ts',
    futureSpecifiers: ['../../../client/scripts/shared/utils/typeGuards.ts'],
    requiredExports: ['isUndefined', 'isNotUndefined', 'isNonEmptyString'],
  },
  {
    legacySpecifier: '../../../client/scripts/helpers/rateLimit.ts',
    futureSpecifiers: ['../../../client/scripts/shared/utils/rateLimit.ts'],
    requiredExports: ['RATE_LIMIT_MESSAGE', 'isRateLimitError'],
  },
  {
    legacySpecifier: '../../../client/scripts/helpers/localStorage.ts',
    futureSpecifiers: ['../../../client/scripts/shared/utils/localStorage.ts'],
    requiredExports: [
      'LocalStorageKeys',
      'getLocalStorageItem',
      'setLocalStorageItem',
    ],
  },
  {
    legacySpecifier: '../../../client/scripts/helpers/string.ts',
    futureSpecifiers: ['../../../client/scripts/shared/utils/string.ts'],
    requiredExports: ['splitCamelOrPascalCase'],
  },
  {
    legacySpecifier: '../../../client/scripts/helpers/number.ts',
    futureSpecifiers: ['../../../client/scripts/shared/utils/number.ts'],
    requiredExports: [
      'calculateRemainingPercentageChangeFractional',
      'roundDecimalsOrReturnWhole',
    ],
  },
  {
    legacySpecifier: '../../../client/scripts/helpers/tooltipTexts.ts',
    futureSpecifiers: ['../../../client/scripts/shared/utils/tooltipTexts.ts'],
    requiredExports: ['disabledStakeButtonTooltipText'],
  },
  {
    legacySpecifier: '../../../client/scripts/helpers/truncate.ts',
    futureSpecifiers: ['../../../client/scripts/shared/utils/truncate.ts'],
    requiredExports: ['truncate'],
  },
  {
    legacySpecifier: '../../../client/scripts/helpers/browser.ts',
    futureSpecifiers: ['../../../client/scripts/shared/utils/browser.ts'],
    requiredExports: ['getBrowserInfo', 'getBrowserType'],
  },
  {
    legacySpecifier: '../../../client/scripts/helpers/awsHelpers.ts',
    futureSpecifiers: ['../../../client/scripts/shared/utils/awsHelpers.ts'],
    requiredExports: ['isS3URL'],
  },
  {
    legacySpecifier: '../../../client/scripts/helpers/dom.ts',
    futureSpecifiers: ['../../../client/scripts/shared/utils/dom.ts'],
    requiredExports: ['listenForDOMNodeApperance'],
  },
  {
    legacySpecifier: '../../../client/scripts/helpers/image.ts',
    futureSpecifiers: ['../../../client/scripts/shared/utils/image.ts'],
    requiredExports: ['generateBlobImageFromAlphabet'],
  },
  {
    legacySpecifier: '../../../client/scripts/utils/Permissions.ts',
    futureSpecifiers: ['../../../client/scripts/shared/utils/Permissions.ts'],
    requiredExports: ['default'],
  },
  {
    legacySpecifier: '../../../client/scripts/utils/clipboard.ts',
    futureSpecifiers: ['../../../client/scripts/shared/utils/clipboard.ts'],
    requiredExports: ['saveToClipboard'],
  },
  {
    legacySpecifier: '../../../client/scripts/utils/downloadDataAsFile.ts',
    futureSpecifiers: [
      '../../../client/scripts/shared/utils/downloadDataAsFile.ts',
    ],
    requiredExports: ['downloadDataAsFile'],
  },
  {
    legacySpecifier: '../../../client/scripts/hooks/useDraft.tsx',
    futureSpecifiers: [
      '../../../client/scripts/shared/hooks/useDraft.tsx',
      '../../../client/scripts/shared/hooks/useDraft.ts',
    ],
    requiredExports: ['useDraft'],
  },
  {
    legacySpecifier: '../../../client/scripts/hooks/useBeforeUnload.ts',
    futureSpecifiers: [
      '../../../client/scripts/shared/hooks/useBeforeUnload.ts',
    ],
    requiredExports: ['default'],
  },
  {
    legacySpecifier: '../../../client/scripts/hooks/useWindowResize.ts',
    futureSpecifiers: [
      '../../../client/scripts/shared/hooks/useWindowResize.ts',
    ],
    requiredExports: ['default'],
  },
  {
    legacySpecifier: '../../../client/scripts/hooks/useNecessaryEffect.ts',
    futureSpecifiers: [
      '../../../client/scripts/shared/hooks/useNecessaryEffect.ts',
    ],
    requiredExports: ['default'],
  },
  {
    legacySpecifier: '../../../client/scripts/hooks/useForceRerender.ts',
    futureSpecifiers: [
      '../../../client/scripts/shared/hooks/useForceRerender.ts',
    ],
    requiredExports: ['default'],
  },
];

const importIfAvailable = async (
  specifiers: string[],
): Promise<Record<string, unknown> | null> => {
  for (const specifier of specifiers) {
    try {
      return await import(/* @vite-ignore */ specifier);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const unresolved =
        message.includes('Failed to resolve import') ||
        message.includes('Failed to load url') ||
        message.includes('Cannot find module') ||
        message.includes('ERR_MODULE_NOT_FOUND');

      if (!unresolved) {
        throw error;
      }
    }
  }

  return null;
};

describe('legacy path re-export compatibility contracts', () => {
  test.each(contracts)(
    '$legacySpecifier stays stable and remains compatible with future path',
    async ({ legacySpecifier, futureSpecifiers, requiredExports }) => {
      const legacyModule = (await import(
        /* @vite-ignore */ legacySpecifier
      )) as Record<string, unknown>;
      const futureModule = await importIfAvailable(futureSpecifiers);

      for (const exportName of requiredExports) {
        expect(legacyModule[exportName]).toBeDefined();
      }

      if (futureModule) {
        for (const exportName of requiredExports) {
          expect(futureModule[exportName]).toBe(legacyModule[exportName]);
        }
      }
    },
  );
});
