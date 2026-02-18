import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { renderWithProviders } from '../renderWithProviders';

const {
  getStakeHistoricalPriceUseQueryMock,
  useCommonNavigateMock,
  useFetchTokenUsdRateQueryMock,
  useFlagMock,
  useManageCommunityStakeModalStoreMock,
} = vi.hoisted(() => ({
  useFlagMock: vi.fn(),
  useCommonNavigateMock: vi.fn(),
  useManageCommunityStakeModalStoreMock: vi.fn(),
  getStakeHistoricalPriceUseQueryMock: vi.fn(),
  useFetchTokenUsdRateQueryMock: vi.fn(),
}));

vi.mock('hooks/useFlag', () => ({
  useFlag: useFlagMock,
}));

vi.mock('navigation/helpers', () => ({
  useCommonNavigate: useCommonNavigateMock,
}));

vi.mock('state/ui/modals', () => ({
  useManageCommunityStakeModalStore: useManageCommunityStakeModalStoreMock,
}));

vi.mock('state/api/communityStake/index', () => ({
  useFetchTokenUsdRateQuery: useFetchTokenUsdRateQueryMock,
}));

vi.mock('state/api/feeds/fetchUserActivity', () => ({
  useFetchGlobalActivityQuery: vi.fn(),
}));

vi.mock('utils/trpcClient', () => ({
  trpc: {
    community: {
      getStakeHistoricalPrice: {
        useQuery: getStakeHistoricalPriceUseQueryMock,
      },
    },
  },
}));

vi.mock('views/components/component_kit/new_designs/CWPageLayout', () => ({
  default: React.forwardRef<
    HTMLDivElement,
    { children?: React.ReactNode; className?: string }
  >(({ children, className }, ref) => (
    <div ref={ref} className={className} data-testid="cw-page-layout">
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
    open ? <div data-testid="cw-modal">{content}</div> : null,
}));

vi.mock('views/components/component_kit/new_designs/CWTextInput', () => ({
  CWTextInput: ({
    onInput,
    placeholder,
    value,
  }: {
    onInput?: (event: { target: { value: string } }) => void;
    placeholder?: string;
    value?: string;
  }) => (
    <input
      aria-label={placeholder}
      placeholder={placeholder}
      value={value}
      onChange={(event) =>
        onInput?.({
          target: { value: event.currentTarget.value },
        })
      }
    />
  ),
}));

vi.mock('views/components/component_kit/new_designs/CWTabs/CWTabsRow', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tabs-row">{children}</div>
  ),
}));

vi.mock('views/components/component_kit/new_designs/CWTabs/CWTab', () => ({
  default: ({
    isSelected,
    label,
    onClick,
  }: {
    isSelected: boolean;
    label: string;
    onClick: () => void;
  }) => (
    <button aria-pressed={isSelected} onClick={onClick} type="button">
      {label}
    </button>
  ),
}));

vi.mock('views/components/component_kit/cw_icons/cw_icon', () => ({
  CWIcon: () => <span data-testid="cw-icon" />,
}));

vi.mock('views/modals/ManageCommunityStakeModal', () => ({
  default: () => <div data-testid="manage-community-stake-modal" />,
}));

vi.mock('views/pages/ExplorePage/AllTabContent', () => ({
  default: () => <div data-testid="explore-all-tab-content" />,
}));

vi.mock('views/pages/ExplorePage/CommunitiesList', () => ({
  default: () => <div data-testid="explore-communities-list" />,
}));

vi.mock('views/pages/ExplorePage/ExploreContestList', () => ({
  default: () => <div data-testid="explore-contest-list" />,
}));

vi.mock('views/pages/ExplorePage/IdeaLaunchpad', () => ({
  default: () => <div data-testid="idea-launchpad" />,
}));

vi.mock('views/pages/ExplorePage/MarketsList', () => ({
  default: () => <div data-testid="explore-markets-list" />,
}));

vi.mock('views/pages/ExplorePage/QuestList', () => ({
  default: () => <div data-testid="explore-quest-list" />,
}));

vi.mock('views/pages/ExplorePage/ThreadFeed/ThreadFeed', () => ({
  ThreadFeed: () => <div data-testid="explore-thread-feed" />,
}));

vi.mock('views/pages/ExplorePage/TokensList', () => ({
  default: () => <div data-testid="explore-tokens-list" />,
}));

vi.mock('views/pages/Leaderboard/XPTable/XPTable', () => ({
  default: () => <div data-testid="explore-users-table" />,
}));

import ExplorePage from '../../../client/scripts/views/pages/ExplorePage/ExplorePage';

describe('ExplorePage integration', () => {
  beforeEach(() => {
    useFlagMock.mockReset();
    useCommonNavigateMock.mockReset();
    useManageCommunityStakeModalStoreMock.mockReset();
    getStakeHistoricalPriceUseQueryMock.mockReset();
    useFetchTokenUsdRateQueryMock.mockReset();

    useFlagMock.mockImplementation((flag: string) => flag === 'markets');
    useCommonNavigateMock.mockReturnValue(vi.fn());
    useManageCommunityStakeModalStoreMock.mockReturnValue({
      modeOfManageCommunityStakeModal: null,
      setModeOfManageCommunityStakeModal: vi.fn(),
    });
    getStakeHistoricalPriceUseQueryMock.mockReturnValue({
      data: [],
      isLoading: false,
    });
    useFetchTokenUsdRateQueryMock.mockReturnValue({
      data: { data: { data: { amount: '3200' } } },
      isLoading: false,
    });
  });

  test('renders all-tab shell and key controls', () => {
    renderWithProviders(<ExplorePage />, {
      initialRoute: '/explore?tab=all',
    });

    expect(screen.getByText('Explore')).toBeInTheDocument();
    expect(screen.getByTestId('idea-launchpad')).toBeInTheDocument();
    expect(screen.getByTestId('explore-all-tab-content')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Communities' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Threads' })).toBeInTheDocument();
  });

  test('renders tab-specific quest and markets content', () => {
    renderWithProviders(<ExplorePage />, {
      initialRoute: '/explore?tab=quests',
    });

    expect(screen.getByTestId('explore-quest-list')).toBeInTheDocument();

    renderWithProviders(<ExplorePage />, {
      initialRoute: '/explore?tab=markets',
    });

    expect(screen.getByTestId('explore-markets-list')).toBeInTheDocument();
  });

  test('uses route navigation when switching tabs', async () => {
    const navigateSpy = vi.fn();
    useCommonNavigateMock.mockReturnValue(navigateSpy);

    renderWithProviders(<ExplorePage />, {
      initialRoute: '/explore?tab=all',
    });

    await userEvent.click(screen.getByRole('button', { name: 'Communities' }));

    expect(navigateSpy).toHaveBeenCalledWith('/explore?tab=communities');
  });
});
