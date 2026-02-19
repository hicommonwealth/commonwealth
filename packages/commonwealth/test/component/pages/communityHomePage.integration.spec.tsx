import { screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { renderWithProviders } from '../renderWithProviders';

const {
  appMock,
  useCreateThreadMutationMock,
  useFetchTopicsQueryMock,
  useGetCommunityByIdQueryMock,
  useManageCommunityStakeModalStoreMock,
  useUserStoreMock,
} = vi.hoisted(() => ({
  useGetCommunityByIdQueryMock: vi.fn(),
  useFetchTopicsQueryMock: vi.fn(),
  useCreateThreadMutationMock: vi.fn(),
  useManageCommunityStakeModalStoreMock: vi.fn(),
  useUserStoreMock: vi.fn(),
  appMock: {
    activeChainId: vi.fn(() => 'cmntest'),
    chain: {
      meta: {
        id: 'cmntest',
        profile_count: 12,
      },
    },
  },
}));

vi.mock('client/scripts/state', () => ({
  default: appMock,
}));

vi.mock('client/scripts/state/api/communities', () => ({
  useGetCommunityByIdQuery: useGetCommunityByIdQueryMock,
}));

vi.mock('state/api/topics', () => ({
  useFetchTopicsQuery: useFetchTopicsQueryMock,
}));

vi.mock('state/api/threads/createThread', () => ({
  default: useCreateThreadMutationMock,
  buildCreateThreadInput: vi.fn(),
}));

vi.mock('client/scripts/state/ui/user', () => ({
  default: useUserStoreMock,
}));

vi.mock('state/ui/modals', () => ({
  useManageCommunityStakeModalStore: useManageCommunityStakeModalStoreMock,
}));

vi.mock('state/api/feeds/fetchUserActivity', () => ({
  useFetchGlobalActivityQuery: vi.fn(),
}));

vi.mock('controllers/app/notifications', () => ({
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
}));

vi.mock('helpers/findDenomination', () => ({
  findDenominationString: vi.fn(() => 'ETH'),
}));

vi.mock('views/components/react_quill_editor', () => ({
  createDeltaFromText: vi.fn(() => ({ ops: [] })),
  getTextFromDelta: vi.fn(() => ''),
}));

vi.mock('views/components/component_kit/new_designs/CWPageLayout', () => ({
  default: React.forwardRef<
    HTMLDivElement,
    { children?: React.ReactNode; className?: string }
  >(({ children, className }, ref) => (
    <div ref={ref} className={className} data-testid="community-home-layout">
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
    open ? <div data-testid="community-home-modal">{content}</div> : null,
}));

vi.mock('views/components/StickEditorContainer', () => ({
  StickyInput: () => <div data-testid="community-home-sticky-input" />,
}));

vi.mock(
  'views/components/StickEditorContainer/context/StickCommentProvider',
  () => ({
    StickCommentProvider: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
  }),
);

vi.mock(
  'views/components/StickEditorContainer/context/StickyCommentElementSelector',
  () => ({
    StickyCommentElementSelector: () => (
      <div data-testid="community-home-sticky-comment-selector" />
    ),
  }),
);

vi.mock(
  'views/components/StickEditorContainer/context/WithDefaultStickyComment',
  () => ({
    WithDefaultStickyComment: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
  }),
);

vi.mock('views/modals/ManageCommunityStakeModal', () => ({
  default: () => <div data-testid="manage-community-stake-modal" />,
}));

vi.mock('views/pages/CommunityHome/TokenDetails/TokenDetails', () => ({
  default: ({
    communityDescription,
    communityMemberCount,
    communityThreadCount,
  }: {
    communityDescription: string;
    communityMemberCount: number;
    communityThreadCount: number;
  }) => (
    <div data-testid="community-home-token-details">
      {communityDescription}|{communityMemberCount}|{communityThreadCount}
    </div>
  ),
}));

vi.mock('views/pages/CommunityHome/TokenPerformance/TokenPerformance', () => ({
  default: () => <div data-testid="community-home-token-performance" />,
}));

vi.mock('views/pages/HomePage/TrendingThreadList/TrendingThreadList', () => ({
  default: () => <div data-testid="community-home-trending-threads" />,
}));

vi.mock('views/pages/HomePage/ActiveContestList/ActiveContestList', () => ({
  default: () => <div data-testid="community-home-active-contests" />,
}));

vi.mock(
  'views/pages/CommunityHome/CommunityTransactions/CommunityTransactions',
  () => ({
    default: () => <div data-testid="community-home-transactions" />,
  }),
);

vi.mock('views/pages/HomePage/XpQuestList/XpQuestList', () => ({
  default: () => <div data-testid="community-home-quests" />,
}));

import CommunityHomePage from '../../../client/scripts/views/pages/CommunityHome/CommunityHomePage';

describe('CommunityHomePage integration', () => {
  beforeEach(() => {
    useGetCommunityByIdQueryMock.mockReset();
    useFetchTopicsQueryMock.mockReset();
    useCreateThreadMutationMock.mockReset();
    useManageCommunityStakeModalStoreMock.mockReset();
    useUserStoreMock.mockReset();

    appMock.activeChainId.mockReturnValue('cmntest');
    appMock.chain.meta = {
      id: 'cmntest',
      profile_count: 12,
    };

    useGetCommunityByIdQueryMock.mockReturnValue({
      data: {
        base: 'ethereum',
        description: 'Tokenized community for builders',
        id: 'cmntest',
        lifetime_thread_count: 42,
      },
    });

    useFetchTopicsQueryMock.mockReturnValue({
      data: [{ id: 1, name: 'General' }],
    });

    useCreateThreadMutationMock.mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn(),
    });

    useManageCommunityStakeModalStoreMock.mockReturnValue({
      modeOfManageCommunityStakeModal: null,
      setModeOfManageCommunityStakeModal: vi.fn(),
    });

    useUserStoreMock.mockReturnValue({
      activeAccount: null,
      isLoggedIn: false,
    });
  });

  test('renders community-home shell with key summary state', () => {
    renderWithProviders(<CommunityHomePage />, {
      initialRoute: '/cmntest/home',
    });

    expect(screen.getByText('Community Home')).toBeInTheDocument();
    expect(
      screen.getByTestId('community-home-token-details'),
    ).toHaveTextContent('Tokenized community for builders|12|42');
    expect(
      screen.getByTestId('community-home-token-performance'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('community-home-trending-threads'),
    ).toBeInTheDocument();
  });

  test('shows sticky thread composer only for logged-in users', () => {
    renderWithProviders(<CommunityHomePage />);

    expect(
      screen.queryByTestId('community-home-sticky-input'),
    ).not.toBeInTheDocument();

    useUserStoreMock.mockReturnValue({
      activeAccount: { address: '0xabc' },
      isLoggedIn: true,
    });

    renderWithProviders(<CommunityHomePage />);

    expect(
      screen.getByTestId('community-home-sticky-input'),
    ).toBeInTheDocument();
  });
});
