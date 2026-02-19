import { ChainBase } from '@hicommonwealth/shared';
import { screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { renderWithProviders } from '../renderWithProviders';

const {
  appMock,
  useActiveCosmosProposalsQueryMock,
  useCompletedCosmosProposalsQueryMock,
  useFlagMock,
  useInitChainIfNeededMock,
} = vi.hoisted(() => ({
  useFlagMock: vi.fn(),
  useInitChainIfNeededMock: vi.fn(),
  useActiveCosmosProposalsQueryMock: vi.fn(),
  useCompletedCosmosProposalsQueryMock: vi.fn(),
  appMock: {
    chain: {
      apiInitialized: true,
      base: 'cosmos',
      failed: false,
      loaded: true,
      meta: {},
    },
    chainAdapterReady: {
      on: vi.fn(),
      off: vi.fn(),
      removeAllListeners: vi.fn(),
    },
  },
}));

vi.mock('shared/hooks/useFlag', () => ({
  useFlag: useFlagMock,
}));

vi.mock('client/scripts/hooks/useInitChainIfNeeded', () => ({
  useInitChainIfNeeded: useInitChainIfNeededMock,
}));

vi.mock('client/scripts/state', () => ({
  default: appMock,
}));

vi.mock('client/scripts/state/api/proposals', () => ({
  useActiveCosmosProposalsQuery: useActiveCosmosProposalsQueryMock,
  useCompletedCosmosProposalsQuery: useCompletedCosmosProposalsQueryMock,
}));

vi.mock('views/components/component_kit/new_designs/CWPageLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="governance-layout">{children}</div>
  ),
}));

vi.mock('views/components/LoadingIndicator/LoadingIndicator', () => ({
  LoadingIndicator: ({ message }: { message: string }) => (
    <div data-testid="governance-loading">{message}</div>
  ),
}));

vi.mock('views/pages/404', () => ({
  PageNotFound: ({ message, title }: { message?: string; title?: string }) => (
    <div data-testid="governance-not-found">
      {title || 'Page Not Found'}
      {message ? ` ${message}` : ''}
    </div>
  ),
}));

vi.mock('views/pages/GovernancePage/GovernanceCards', () => ({
  default: ({ totalProposals }: { totalProposals: number }) => (
    <div data-testid="governance-cards">total:{totalProposals}</div>
  ),
}));

vi.mock('views/pages/GovernancePage/GovernanceHeader/GovernanceHeader', () => ({
  default: () => <div data-testid="governance-header" />,
}));

vi.mock('views/pages/GovernancePage/ProposalListing/ProposalListing', () => ({
  default: () => <div data-testid="governance-proposal-listing" />,
}));

import GovernancePage from '../../../client/scripts/views/pages/GovernancePage/GovernancePage';

describe('GovernancePage integration', () => {
  beforeEach(() => {
    useFlagMock.mockReset();
    useInitChainIfNeededMock.mockReset();
    useActiveCosmosProposalsQueryMock.mockReset();
    useCompletedCosmosProposalsQueryMock.mockReset();

    appMock.chain = {
      apiInitialized: true,
      base: ChainBase.CosmosSDK,
      failed: false,
      loaded: true,
      meta: {},
    } as unknown as typeof appMock.chain;

    useFlagMock.mockReturnValue(true);
    useActiveCosmosProposalsQueryMock.mockReturnValue({
      data: [{ id: 'active-1' }],
      isLoading: false,
    });
    useCompletedCosmosProposalsQueryMock.mockReturnValue({
      data: [{ id: 'completed-1' }, { id: 'completed-2' }],
      isLoading: false,
    });
  });

  test('shows loading state while chain is not initialized', () => {
    appMock.chain = {
      ...appMock.chain,
      apiInitialized: false,
      failed: false,
      loaded: false,
    };

    renderWithProviders(<GovernancePage />);

    expect(screen.getByTestId('governance-loading')).toHaveTextContent(
      'Connecting to chain',
    );
  });

  test('shows chain network error state when provider is invalid', () => {
    appMock.chain = {
      ...appMock.chain,
      apiInitialized: false,
      failed: true,
      loaded: false,
    };

    renderWithProviders(<GovernancePage />);

    expect(screen.getByTestId('governance-not-found')).toHaveTextContent(
      'Wrong Ethereum Provider Network!',
    );
  });

  test('renders governance content when chain is ready', () => {
    renderWithProviders(<GovernancePage />);

    expect(useInitChainIfNeededMock).toHaveBeenCalled();
    expect(screen.getByTestId('governance-header')).toBeInTheDocument();
    expect(screen.getByTestId('governance-cards')).toHaveTextContent('total:3');
    expect(
      screen.getByTestId('governance-proposal-listing'),
    ).toBeInTheDocument();
  });

  test('returns not-found surface when feature is disabled', () => {
    useFlagMock.mockReturnValue(false);
    appMock.chain = {
      ...appMock.chain,
      base: ChainBase.Ethereum,
    };

    renderWithProviders(<GovernancePage />);

    expect(screen.getByTestId('governance-not-found')).toBeInTheDocument();
  });
});
