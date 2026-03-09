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
