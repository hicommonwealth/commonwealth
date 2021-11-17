import 'pages/search.scss';

import m from 'mithril';
import _, { capitalize } from 'lodash';
import moment from 'moment';
import { Input, ListItem, Spinner, TabItem, Tabs, Tag } from 'construct-ui';

import { link, pluralize } from 'helpers';
import {
  ReplyIcon,
  AccountIcon
} from '../components/component_kit/icons';
import app from 'state';
import { AddressInfo, Profile } from 'models';

import QuillFormattedText from 'views/components/quill_formatted_text';
import MarkdownFormattedText from 'views/components/markdown_formatted_text';
import User, { UserBlock } from 'views/components/widgets/user';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import { CommunityLabel } from '../components/sidebar/community_selector';
import PageNotFound from './404';
import { ContentType, initializeSearch, search, SearchType } from '../components/search_bar';

export const ALL_RESULTS_KEY = 'COMMONWEALTH_ALL_RESULTS';
const SEARCH_PAGE_SIZE = 50; // must be same as SQL limit specified in the database query

export const getMemberResult = (addr, searchTerm) => {
  const profile: Profile = app.profiles.getProfile(addr.chain, addr.address);
  if (addr.name) profile.initialize(addr.name, null, null, null, null);

  if (app.isCustomDomain() && app.customDomainId() !== addr.chain) return;

  const scope = m.route.param('chain');
  const userLink = `/${scope || addr.chain}/account/${addr.address}?base=${addr.chain}`;

  return m(ListItem, {
    contentLeft: m(AccountIcon),
    label: m('a.search-results-item', [
      m(UserBlock, {
        user: profile,
        searchTerm,
        avatarSize: 36,
        addressDisplayOptions: { showFullAddress: true },
        showChainName: !scope,
      }),
    ]),
    onclick: (e) => {
      m.route.set(userLink);
    }
  });
};

export const getCommunityResult = (community) => {
  const params = community.contentType === ContentType.Token
    ? { token: community }
    : community.contentType === ContentType.Chain
      ? { chain: community }
      : community.contentType === ContentType.Community
        ? { community }
        : null;
  params['size'] = 36;
  const onSelect = (e) => {
    if (params.token) {
      m.route.set(params.token.address ? `/${params.token.address}` : '/');
    } else {
      m.route.set(community.id ? `/${community.id}` : '/');
    }
  };
  return m(ListItem, {
    label: m('a.search-results-item.community-result', [
      m(CommunityLabel, params),
    ]),
    onclick: onSelect,
    onkeyup: (e) => {
      if (e.key === 'Enter') {
        onSelect(e);
      }
    }
  });
};

export const getDiscussionResult = (thread, searchTerm) => {
  const proposalId = thread.proposalid;
  const chainOrComm = thread.chain || thread.offchain_community;

  if (app.isCustomDomain() && app.customDomainId() !== chainOrComm) return;

  return m(ListItem, {
    onclick: (e) => {
      m.route.set((thread.type === 'thread')
        ? `/${chainOrComm}/proposal/discussion/${proposalId}`
        : `/${chainOrComm}/proposal/${proposalId.split('_')[0]}/${proposalId.split('_')[1]}`);
    },
    label: m('a.search-results-item', [
      thread.type === 'thread' ? [
        m('.search-results-thread-title', [
          decodeURIComponent(thread.title),
        ]),
        m('.search-results-thread-subtitle', [
          m('span.created-at', moment(thread.created_at).fromNow()),
          m(User, { user: new AddressInfo(thread.address_id, thread.address, thread.address_chain, null) }),
        ]),
        m('.search-results-thread-body', [
          (() => {
            try {
              const doc = JSON.parse(decodeURIComponent(thread.body));
              if (!doc.ops) throw new Error();
              return m(QuillFormattedText, {
                doc,
                hideFormatting: true,
                collapse: true,
                searchTerm,
              });
            } catch (e) {
              const doc = decodeURIComponent(thread.body);
              return m(MarkdownFormattedText, {
                doc,
                hideFormatting: true,
                collapse: true,
                searchTerm,
              });
            }
          })(),
        ])
      ] : [
        m('.search-results-thread-title', [
          'Comment on ',
          decodeURIComponent(thread.title),
        ]),
        m('.search-results-thread-subtitle', [
          m('span.created-at', moment(thread.created_at).fromNow()),
          m(User, { user: new AddressInfo(thread.address_id, thread.address, thread.address_chain, null) }),
        ]),
        m('.search-results-comment', [
          (() => {
            try {
              const doc = JSON.parse(decodeURIComponent(thread.body));
              if (!doc.ops) throw new Error();
              return m(QuillFormattedText, {
                doc,
                hideFormatting: true,
                collapse: true,
                searchTerm,
              });
            } catch (e) {
              const doc = decodeURIComponent(thread.body);
              return m(MarkdownFormattedText, {
                doc,
                hideFormatting: true,
                collapse: true,
                searchTerm,
              });
            }
          })(),
        ]),
      ]
    ]),
    contentLeft: m(ReplyIcon)
  });
};

const getListing = (results: any, searchTerm: string, pageCount: number, searchType?: SearchType) => {
  if (Object.keys(results).length === 0) return [];
  const filter = searchType === SearchType.Top ? null : searchType;
  const concatResults = () => {
    let allResults = [];
    [SearchType.Discussion, SearchType.Member, SearchType.Community].forEach((type) => {
      if (results[type]?.length) {
        allResults = allResults.concat(results[type]);
      }
    });
    return allResults;
  };
  const tabScopedResults = (filter ? results[searchType] : concatResults())
    .sort((a, b) => {
      // TODO: Token-sorting approach
      // Some users are not verified; we give them a default date of 1900
      const aCreatedAt = moment(a.created_at || a.createdAt || a.verified || '1900-01-01T:00:00:00Z');
      const bCreatedAt = moment(b.created_at || b.createdAt || b.verified || '1900-01-01T:00:00:00Z');
      return bCreatedAt.diff(aCreatedAt);
    })
    .map((res) => {
      return res.searchType === SearchType.Discussion
        ? getDiscussionResult(res, searchTerm)
        : res.searchType === SearchType.Member
          ? getMemberResult(res, searchTerm)
          : res.searchType === SearchType.Community
            ? getCommunityResult(res)
            : null;
    })
    .slice(0, pageCount * 50);
  return tabScopedResults;
};

const SearchPage : m.Component<{
  results: any[]
}, {
  activeTab: SearchType,
  results: any,
  searchTerm: string,
  searchPrefix: string,
  refreshResults: boolean,
  overridePrefix: boolean,
  pageCount: number,
  errorText: string
}> = {
  oncreate: () => {
    initializeSearch();
  },
  view: (vnode) => {
    const LoadingPage = m(PageLoading, {
      narrow: true,
      showNewProposalButton: true,
      title: [
        'Search ',
        m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
      ],
    });

    const communityScope = m.route.param('comm');
    const chainScope = m.route.param('chain');
    const scope = app.isCustomDomain() ? app.customDomainId() : (communityScope || chainScope);

    const searchTerm = m.route.param('q')?.toLowerCase();
    if (!searchTerm) {
      vnode.state.errorText = 'Must enter query to begin searching';
      return m(PageNotFound, {
        title: 'Search',
        message: 'Please enter a query to begin searching'
      });
    }

    if (!app.searchCache[ALL_RESULTS_KEY]?.loaded) {
      return LoadingPage;
    }

    // re-fetch results for new search if search term or URI has changed
    if (searchTerm !== vnode.state.searchTerm || vnode.state.refreshResults) {
      vnode.state.searchTerm = searchTerm;
      vnode.state.refreshResults = false;
      vnode.state.results = {};
      if (!app.searchCache[vnode.state.searchTerm]) {
        app.searchCache[vnode.state.searchTerm] = { loaded: false };
      }
      search(searchTerm, { communityScope, chainScope }, vnode.state);
      return LoadingPage;
    }

    if (!app.searchCache[searchTerm].loaded) {
      return LoadingPage;
    }

    if (!vnode.state.activeTab) {
      vnode.state.activeTab = SearchType.Top;
    }
    if (!vnode.state.pageCount) {
      vnode.state.pageCount = 1;
    }

    const { results, pageCount, activeTab } = vnode.state;

    const tabScopedListing = getListing(results, searchTerm, pageCount, activeTab);
    const resultCount = activeTab === SearchType.Top
      ? tabScopedListing.length === SEARCH_PAGE_SIZE
        ? `${tabScopedListing.length}+ results`
        : pluralize(tabScopedListing.length, 'result')
      : tabScopedListing.length === SEARCH_PAGE_SIZE
        ? `${tabScopedListing.length}+ ${pluralize(2, activeTab).replace('2 ', '')}`
        : pluralize(tabScopedListing.length, activeTab);

    return m(Sublayout, {
      class: 'SearchPage',
      title: [
        'Search ',
        capitalize(scope) || 'Commonwealth'
      ],
      showNewProposalButton: true,
      alwaysShowTitle: true,
      centerGrid: true,
    }, m(Tabs, [
      m(TabItem, {
        label: 'Top',
        active: activeTab === SearchType.Top,
        onclick: () => {
          vnode.state.pageCount = 1;
          vnode.state.activeTab = SearchType.Top;
        },
      }),
      !scope && !app.isCustomDomain()
      && m(TabItem, {
        label: 'Communities',
        active: activeTab === SearchType.Community,
        onclick: () => {
          vnode.state.pageCount = 1;
          vnode.state.activeTab = SearchType.Community;
        },
      }),
      m(TabItem, {
        label: 'Discussion',
        active: activeTab === SearchType.Discussion,
        onclick: () => {
          vnode.state.pageCount = 1;
          vnode.state.activeTab = SearchType.Discussion;
        },
      }),
      m(TabItem, {
        label: 'Members',
        active: activeTab === SearchType.Member,
        onclick: () => {
          vnode.state.pageCount = 1;
          vnode.state.activeTab = SearchType.Member;
        },
      }),
    ]),
    m('.search-results-wrapper', [
      !app.searchCache[searchTerm].loaded ? m('.search-loading', [
        m(Spinner, {
          active: true,
          fill: true,
          size: 'xl',
        }),
      ]) : vnode.state.errorText ? m('.search-error', [
        m('.error-text', vnode.state.errorText),
      ]) : m('.search-results', [
        m('.search-results-caption', [
          resultCount,
          ' matching \'',
          vnode.state.searchTerm,
          '\'',
          scope
            ? ` in ${capitalize(scope)}.`
            : app.isCustomDomain() ? '' : ' across all communities.',
          scope
            && !app.isCustomDomain()
            && [
              ' ',
              m('a.search-all-communities', {
                href: '#',
                onclick: (e) => {
                  m.route.set(`/search?q=${searchTerm}`);
                  setTimeout(() => {
                    vnode.state.refreshResults = true;
                  }, 0);
                }
              }, 'Search all communities?')
            ]
        ]),
        m('.search-results-list', tabScopedListing),
      ]),
    ]));
  }
};

export default SearchPage;
