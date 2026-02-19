import { screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { renderWithProviders } from '../renderWithProviders';

const { useFlagMock, useManageCommunityStakeModalStoreMock } = vi.hoisted(
  () => ({
    useFlagMock: vi.fn(),
    useManageCommunityStakeModalStoreMock: vi.fn(),
  }),
);

vi.mock('shared/hooks/useFlag', () => ({
  useFlag: useFlagMock,
}));

vi.mock('state/ui/modals', () => ({
  useManageCommunityStakeModalStore: useManageCommunityStakeModalStoreMock,
}));

vi.mock('helpers/findDenomination', () => ({
  findDenominationString: vi.fn(() => 'ETH'),
}));

vi.mock('state/api/feeds/fetchUserActivity', () => ({
  useFetchGlobalActivityQuery: vi.fn(),
}));

vi.mock('views/components/component_kit/new_designs/CWPageLayout', () => ({
  default: React.forwardRef<
    HTMLDivElement,
    { children?: React.ReactNode; className?: string }
  >(({ children, className }, ref) => (
    <div ref={ref} className={className} data-testid="home-page-layout">
      {children}
    </div>
  )),
}));

vi.mock('views/components/component_kit/cw_text', () => ({
  CWText: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('views/components/component_kit/new_designs/CWModal', () => ({
  CWModal: ({ content, open }: { content: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="home-page-modal">{content}</div> : null,
}));

vi.mock('views/modals/ManageCommunityStakeModal', () => ({
  default: () => <div data-testid="manage-community-stake-modal" />,
}));

vi.mock('views/pages/ExplorePage/IdeaLaunchpad', () => ({
  default: () => <div data-testid="home-idea-launchpad" />,
}));

vi.mock(
  'views/pages/user_dashboard/TrendingCommunitiesPreview/TrendingCommunitiesPreview',
  () => ({
    TrendingCommunitiesPreview: () => (
      <div data-testid="home-trending-communities" />
    ),
  }),
);

vi.mock('views/pages/HomePage/ActiveContestList/ActiveContestList', () => ({
  default: () => <div data-testid="home-active-contests" />,
}));

vi.mock('views/pages/HomePage/TrendingThreadList/TrendingThreadList', () => ({
  default: () => <div data-testid="home-trending-threads" />,
}));

vi.mock('views/pages/HomePage/TrendingTokenList/TrendingTokenList', () => ({
  default: ({ heading }: { heading: string }) => (
    <div data-testid="home-trending-token-list">{heading}</div>
  ),
}));

vi.mock('views/pages/HomePage/XpQuestList/XpQuestList', () => ({
  default: () => <div data-testid="home-quests" />,
}));

vi.mock('views/pages/HomePage/iOSBanner', () => ({
  default: () => <div data-testid="home-ios-banner" />,
}));

import HomePage from '../../../client/scripts/views/pages/HomePage/HomePage';

describe('HomePage integration', () => {
  beforeEach(() => {
    useFlagMock.mockReset();
    useManageCommunityStakeModalStoreMock.mockReset();

    useFlagMock.mockImplementation((flag: string) => flag === 'mobileDownload');
    useManageCommunityStakeModalStoreMock.mockReturnValue({
      modeOfManageCommunityStakeModal: null,
      setModeOfManageCommunityStakeModal: vi.fn(),
    });
  });

  test('renders home shell with key sections', () => {
    useFlagMock.mockReturnValue(false);

    renderWithProviders(<HomePage />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByTestId('home-idea-launchpad')).toBeInTheDocument();
    expect(screen.getAllByTestId('home-trending-token-list')).toHaveLength(3);
    expect(screen.getByText('Trending')).toBeInTheDocument();
    expect(screen.getByText('Recently Launched')).toBeInTheDocument();
    expect(screen.getByText('Graduated')).toBeInTheDocument();
    expect(screen.getByTestId('home-trending-communities')).toBeInTheDocument();
  });

  test('renders iOS banner when mobile-download feature flag is on', () => {
    useFlagMock.mockReturnValue(true);

    renderWithProviders(<HomePage />);

    expect(screen.getByTestId('home-ios-banner')).toBeInTheDocument();
  });
});
