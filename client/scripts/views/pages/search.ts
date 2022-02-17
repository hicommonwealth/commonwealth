import 'pages/search.scss';

import m from 'mithril';
import _, { capitalize } from 'lodash';
import moment from 'moment';
import {
  Button,
  ListItem,
  Select,
  Spinner,
  TabItem,
  Tabs,
  Tag,
} from 'construct-ui';

import { pluralize } from 'helpers';
import app from 'state';
import { AddressInfo, Profile, SearchQuery } from 'models';
import { getProposalUrlPath } from 'identifiers';
import { ProposalType } from 'types';

import { SearchScope, SearchSort } from 'models/SearchQuery'

import QuillFormattedText from 'views/components/quill_formatted_text';
import MarkdownFormattedText from 'views/components/markdown_formatted_text';
import User, { UserBlock } from 'views/components/widgets/user';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import { ContentType } from 'controllers/server/search';
import { CommunityLabel } from '../components/sidebar/community_selector';
import PageNotFound from './404';
import { search } from '../components/search_bar';
import { CWIcon } from '../components/component_kit/cw_icons/cw_icon';

const SEARCH_PAGE_SIZE = 50; // must be same as SQL limit specified in the database query

export const getMemberResult = (addr, searchTerm) => {
  const profile: Profile = app.profiles.getProfile(addr.chain, addr.address);
  if (addr.name) profile.initialize(addr.name, null, null, null, null);

  if (app.isCustomDomain() && app.customDomainId() !== addr.chain) return;

  const scope = m.route.param('chain');
  const userLink = `/${scope || addr.chain}/account/${addr.address}?base=${
    addr.chain
  }`;

  return m(ListItem, {
    allowOnContentClick: true,
    contentLeft: m(CWIcon, {
      iconSize: 'large',
      iconName: 'account',
    }),
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
    },
  });
};

export const getCommunityResult = (community) => {
  const params =
    community.contentType === ContentType.Token
      ? { token: community }
      : community.contentType === ContentType.Chain
      ? { chain: community }
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
    },
  });
};

export const getDiscussionResult = (thread, searchTerm) => {
  const proposalId = thread.proposalid;
  const chainOrComm = thread.chain || thread.offchain_community;

  if (app.isCustomDomain() && app.customDomainId() !== chainOrComm) return;

  return m(ListItem, {
    allowOnContentClick: true,
    contentLeft: m(CWIcon, {
      iconName: 'feedback',
    }),
    onclick: () => {
      const path = getProposalUrlPath(ProposalType.OffchainThread, proposalId, false, chainOrComm);
      m.route.set(path);
    },
    label: m('a.search-results-item', [
      m('.search-results-thread-header disabled', [
        `discussion - ${thread.chain || thread.community}`,
      ]),
      m('.search-results-thread-title', [decodeURIComponent(thread.title)]),
      m('.search-results-thread-subtitle', [
        m('span.created-at', moment(thread.created_at).fromNow()),
        m(User, {
          user: new AddressInfo(
            thread.address_id,
            thread.address,
            thread.address_chain,
            null
          ),
        }),
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
      ]),
    ]),
  });
};

export const getCommentResult = (comment, searchTerm) => {
  const proposalId = comment.proposalid;
  const chainOrComm = comment.chain || comment.offchain_community;

  if (app.isCustomDomain() && app.customDomainId() !== chainOrComm) return;

  return m(ListItem, {
    allowOnContentClick: true,
    contentLeft: m(CWIcon, {
      iconName: 'feedback',
    }),
    onclick: (e) => {
      const [slug, id] = proposalId.split('_');
      const path = getProposalUrlPath(slug, id, false, chainOrComm);
      m.route.set(path);
    },
    label: m('a.search-results-item', [
      m('.search-results-thread-header disabled', [
        `comment - ${comment.chain || comment.community}`,
      ]),
      m('.search-results-thread-title', [decodeURIComponent(comment.title)]),
      m('.search-results-thread-subtitle', [
        m('span.created-at', moment(comment.created_at).fromNow()),
        m(User, {
          user: new AddressInfo(
            comment.address_id,
            comment.address,
            comment.address_chain,
            null
          ),
        }),
      ]),
      m('.search-results-comment', [
        (() => {
          try {
            const doc = JSON.parse(decodeURIComponent(comment.text));
            if (!doc.ops) throw new Error();
            return m(QuillFormattedText, {
              doc,
              hideFormatting: true,
              collapse: true,
              searchTerm,
            });
          } catch (e) {
            const doc = decodeURIComponent(comment.text);
            return m(MarkdownFormattedText, {
              doc,
              hideFormatting: true,
              collapse: true,
              searchTerm,
            });
          }
        })(),
      ]),
    ]),
  });
};

const getListing = (
  results: any,
  searchTerm: string,
  pageCount: number,
  sort: SearchSort,
  searchType?: SearchScope
) => {
  if (Object.keys(results).length === 0 || !results[searchType]) return [];
  const tabScopedResults = results[searchType]
    .map((res) => {
      return res.searchType === SearchScope.Threads
        ? getDiscussionResult(res, searchTerm)
        : res.searchType === SearchScope.Members
        ? getMemberResult(res, searchTerm)
        : res.searchType === SearchScope.Communities
        ? getCommunityResult(res)
        : res.searchType === SearchScope.Replies
        ? getCommentResult(res, searchTerm)
        : null;
    })
    .slice(0, pageCount * 50);
  return tabScopedResults;
};

const SearchPage: m.Component<
  {
    results: any[];
  },
  {
    activeTab: SearchScope;
    results: any;
    refreshResults: boolean;
    pageCount: number;
    errorText: string;
    searchQuery: SearchQuery;
  }
> = {
  view: (vnode) => {
    const LoadingPage = m(PageLoading, {
      narrow: true,
      showNewProposalButton: true,
      title: [
        'Search ',
        m(Tag, {
          size: 'xs',
          label: 'Beta',
          style: 'position: relative; top: -2px; margin-left: 6px',
        }),
      ],
    });

    const searchQuery = SearchQuery.fromUrlParams(m.route.param());

    const { chainScope, searchTerm } = searchQuery;
    const scope = app.isCustomDomain() ? app.customDomainId() : chainScope;

    if (!app.search.isValidQuery(searchQuery)) {
      vnode.state.errorText =
        'Must enter query longer than 3 characters to begin searching';
      return m(PageNotFound, {
        title: 'Search',
        message:
          'Please enter a query longer than 3 characters to begin searching',
      });
    }

    // re-fetch results for new search if search term or URI has changed
    if (
      !_.isEqual(searchQuery, vnode.state.searchQuery) ||
      vnode.state.refreshResults
    ) {
      vnode.state.searchQuery = searchQuery;
      vnode.state.refreshResults = false;
      vnode.state.results = {};
      search(searchQuery, vnode.state);
      return LoadingPage;
    }

    if (!app.search.getByQuery(searchQuery)?.loaded) {
      return LoadingPage;
    }

    if (!vnode.state.activeTab) {
      vnode.state.activeTab = searchQuery.getSearchScope()[0];
    }
    if (!vnode.state.pageCount) {
      vnode.state.pageCount = 1;
    }

    const { results, pageCount, activeTab } = vnode.state;

    const getTab = (searchScope: SearchScope) => {
      return m(TabItem, {
        label: `${searchScope}`,
        active: vnode.state.activeTab === searchScope,
        onclick: () => {
          vnode.state.pageCount = 1;
          vnode.state.activeTab = searchScope;
        },
      });
    };

    const tabs = vnode.state.searchQuery.getSearchScope().map(getTab);
    const tabScopedListing = getListing(
      results,
      searchTerm,
      pageCount,
      searchQuery.sort,
      activeTab
    );
    const resultCount =
      tabScopedListing.length === SEARCH_PAGE_SIZE
        ? `${tabScopedListing.length}+ ${pluralize(
            2,
            activeTab.toLowerCase()
          ).replace('2 ', '')}`
        : pluralize(tabScopedListing.length, activeTab.toLowerCase());

    const filterBar = m('.search-results-filters', [
      m('h4', 'Sort By: '),
      m(Select, {
        basic: true,
        options: ['Best', 'Newest', 'Oldest'],
        value: vnode.state.searchQuery.sort,
        onchange: (e) => {
          searchQuery.sort = SearchSort[e.currentTarget['value']];
          m.route.set(`/search?${searchQuery.toUrlParams()}`);
          setTimeout(() => {
            vnode.state.refreshResults = true;
          }, 0);
        },
      }),
    ]);

    return m(
      Sublayout,
      {
        class: 'SearchPage',
        title: ['Search ', capitalize(scope) || 'Commonwealth'],
        showNewProposalButton: true,
        alwaysShowTitle: true,
        centerGrid: true,
      },
      m(Tabs, tabs),
      m('.search-results-wrapper', [
        !app.search.getByQuery(searchQuery)?.loaded
          ? m('.search-loading', [
              m(Spinner, {
                active: true,
                fill: true,
                size: 'xl',
              }),
            ])
          : vnode.state.errorText
          ? m('.search-error', [m('.error-text', vnode.state.errorText)])
          : m('.search-results', [
              m('.search-results-caption', [
                resultCount,
                " matching '",
                vnode.state.searchQuery.searchTerm,
                "'",
                scope
                  ? ` in ${capitalize(scope)}.`
                  : app.isCustomDomain()
                  ? ''
                  : ' across all communities.',
                scope &&
                  !app.isCustomDomain() && [
                    ' ',
                    m(
                      'a.search-all-communities',
                      {
                        href: '#',
                        onclick: () => {
                          searchQuery.chainScope = undefined;
                          m.route.set(`/search?${searchQuery.toUrlParams()}`);
                          setTimeout(() => {
                            vnode.state.refreshResults = true;
                          }, 0);
                        },
                      },
                      'Search all communities?'
                    ),
                  ],
              ]),
              resultCount === '0' ? null : filterBar,
              m('.search-results-list', tabScopedListing),
            ]),
      ])
    );
  },
};

export default SearchPage;
