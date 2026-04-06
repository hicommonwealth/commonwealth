import { beforeEach, describe, expect, test, vi } from 'vitest';

const hoisted = vi.hoisted(() => {
  const httpLinkMock = vi.fn((options: unknown) => ({
    kind: 'httpLink',
    options,
  }));
  const createClientMock = vi.fn((config: unknown) => ({
    kind: 'trpcClient',
    config,
  }));
  const createTRPCReactMock = vi.fn(() => ({
    createClient: createClientMock,
  }));
  const createTRPCQueryUtilsMock = vi.fn((config: unknown) => ({
    kind: 'trpcQueryUtils',
    config,
  }));

  return {
    httpLinkMock,
    createClientMock,
    createTRPCReactMock,
    createTRPCQueryUtilsMock,
    queryClientMock: { id: 'query-client' },
    userState: {
      jwt: '',
      isOnPWA: undefined as boolean | undefined,
      addressSelectorSelectedAddress: undefined as string | undefined,
      activeAccount: null as null | { address?: string },
      addresses: [] as Array<{ address?: string }>,
    },
  };
});

vi.mock('@trpc/client', () => ({
  httpLink: hoisted.httpLinkMock,
}));

vi.mock('@trpc/react-query', () => ({
  createTRPCReact: hoisted.createTRPCReactMock,
  createTRPCQueryUtils: hoisted.createTRPCQueryUtilsMock,
}));

vi.mock('../../../client/scripts/state/api/config', () => ({
  queryClient: hoisted.queryClientMock,
}));
vi.mock('../../../client/scripts/state/api/config.ts', () => ({
  queryClient: hoisted.queryClientMock,
}));

vi.mock('../../../client/scripts/state/ui/user', () => ({
  userStore: {
    getState: () => hoisted.userState,
  },
}));
vi.mock('../../../client/scripts/state/ui/user/index.ts', () => ({
  userStore: {
    getState: () => hoisted.userState,
  },
}));

const loadModule = () => import('../../../client/scripts/utils/trpcClient');

describe('trpcClient legacy-path contract', () => {
  beforeEach(() => {
    vi.resetModules();
    hoisted.httpLinkMock.mockClear();
    hoisted.createClientMock.mockClear();
    hoisted.createTRPCReactMock.mockClear();
    hoisted.createTRPCQueryUtilsMock.mockClear();
    hoisted.userState.jwt = '';
    hoisted.userState.isOnPWA = undefined;
    hoisted.userState.addressSelectorSelectedAddress = undefined;
    hoisted.userState.activeAccount = null;
    hoisted.userState.addresses = [];
  });

  test('exports stable symbols and wires client/query utils', async () => {
    const module = await loadModule();

    expect(module.BASE_API_PATH).toBe('/api/internal/trpc');
    expect(module.trpc).toBeDefined();
    expect(module.trpcClient).toBeDefined();
    expect(module.trpcQueryUtils).toBeDefined();

    expect(hoisted.createTRPCReactMock).toHaveBeenCalledTimes(1);
    expect(hoisted.createClientMock).toHaveBeenCalledTimes(1);
    expect(hoisted.httpLinkMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/internal/trpc',
        headers: expect.any(Function),
      }),
    );
    expect(hoisted.createTRPCQueryUtilsMock).toHaveBeenCalledWith({
      queryClient: hoisted.queryClientMock,
      client: module.trpcClient,
    });
  });

  test('header builder preserves auth and address precedence', async () => {
    await loadModule();

    const httpLinkConfig = hoisted.httpLinkMock.mock.calls[0]?.[0] as {
      headers: () => Record<string, unknown>;
    };
    const headers = httpLinkConfig.headers;

    hoisted.userState.jwt = 'jwt-token';
    hoisted.userState.isOnPWA = true;
    hoisted.userState.addressSelectorSelectedAddress = '0x-selector';
    hoisted.userState.activeAccount = { address: '0x-active' };
    hoisted.userState.addresses = [{ address: '0x-fallback' }];

    expect(headers()).toEqual({
      authorization: 'jwt-token',
      isPWA: 'true',
      address: '0x-selector',
    });

    hoisted.userState.addressSelectorSelectedAddress = undefined;
    expect(headers().address).toBe('0x-active');

    hoisted.userState.activeAccount = null;
    expect(headers().address).toBe('0x-fallback');
  });
});
