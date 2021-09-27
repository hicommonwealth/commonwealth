import 'pages/search.scss';

import m from 'mithril';
import $ from 'jquery';
import _, { capitalize } from 'lodash';
import { ControlGroup, Icon, Icons, Input, List, ListItem, Spinner } from 'construct-ui';
import {
  searchMentionableAddresses,
  searchDiscussions,
  searchChainsAndCommunities,
} from 'helpers/search';
import app from 'state';
import { notifyError } from 'controllers/app/notifications';
import { Profile, AddressInfo } from 'models';
import moment from 'moment';
import MarkdownFormattedText from './markdown_formatted_text';
import { IconIntent, SearchIcon } from '../components/component_kit/icons';
import QuillFormattedText from './quill_formatted_text';
import { CommunityLabel } from './sidebar/community_selector';
import User, { UserBlock } from './widgets/user';
import { ALL_RESULTS_KEY } from '../pages/search';
import { ChainIcon, CommunityIcon } from './chain_icon';

export interface SearchParams {
  communityScope?: string;
  chainScope?: string;
  isSearchPreview?: boolean;
  isHomepageSearch?: boolean;
  resultSize?: number;
}

export enum SearchType {
  Discussion = 'discussion',
  Community = 'community',
  Member = 'member',
  Top = 'top',
}

export enum ContentType {
  Thread = 'thread',
  Comment = 'comment',
  Community = 'community',
  Chain = 'chain',
  Token = 'token',
  Member = 'member'
}

const SEARCH_PREVIEW_SIZE = 6;
const SEARCH_PAGE_SIZE = 50; // must be same as SQL limit specified in the database query

export const getMemberPreview = (addr, closeResultsFn, searchTerm, tabIndex, showChainName?) => {
  const profile: Profile = app.profiles.getProfile(addr.chain, addr.address);
  if (addr.name) profile.initialize(addr.name, null, null, null, null);
  const userLink = `${app.isCustomDomain() ? '' : `/${app.activeId() || addr.chain}`
  }/account/${addr.address}?base=${addr.chain}`;
  return m(ListItem, {
    tabIndex,
    label: m('a.search-results-item', [
      m(UserBlock, {
        user: profile,
        searchTerm,
        avatarSize: 24,
        showAddressWithDisplayName: true,
        addressDisplayOptions: { showFullAddress: true },
        showChainName,
      }),
    ]),
    onclick: (e) => {
      m.route.set(userLink);
      closeResultsFn();
    },
    onkeyup: (e) => {
      if (e.key === 'Enter') {
        m.route.set(userLink);
        closeResultsFn();
      }
    }
  });
};

export const getCommunityPreview = (community, closeResultsFn, tabIndex) => {
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
    closeResultsFn();
  };
  return m(ListItem, {
    tabIndex,
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

export const getDiscussionPreview = (thread, closeResultsFn, searchTerm, tabIndex) => {
  const proposalId = thread.proposalid;
  const chainOrComm = thread.chain || thread.offchain_community;
  const onSelect = (e) => {
    if (!chainOrComm) {
      notifyError('Discussion not found.');
      return;
    }
    m.route.set((thread.type === 'thread')
      ? `/${chainOrComm}/proposal/discussion/${proposalId}`
      : `/${chainOrComm}/proposal/${proposalId.split('_')[0]}/${proposalId.split('_')[1]}`);
    closeResultsFn();
  };
  return m(ListItem, {
    tabIndex,
    onclick: onSelect,
    onkeyup: (e) => {
      if (e.key === 'Enter') {
        onSelect(e);
      }
    },
    label: m('a.search-results-item', [
      thread.type === 'thread' ? [
        m('.search-results-thread-title', [
          decodeURIComponent(thread.title),
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
  });
};

const sortResults = (a, b) => {
  // TODO: Token-sorting approach
  // Some users are not verified; we give them a default date of 1900
  const aCreatedAt = moment(a.created_at || a.createdAt || a.verified || '1900-01-01T:00:00:00Z');
  const bCreatedAt = moment(b.created_at || b.createdAt || b.verified || '1900-01-01T:00:00:00Z');
  return bCreatedAt.diff(aCreatedAt);
};

const getBalancedContentListing = (unfilteredResults: any[], types: SearchType[]) => {
  const results = {};
  let unfilteredResultsLength = 0;
  for (const key of types) {
    results[key] = [];
    unfilteredResultsLength += (unfilteredResults[key]?.length || 0);
  }
  let priorityPosition = 0;
  let resultsLength = 0;
  while (resultsLength < 6 && (resultsLength < unfilteredResultsLength)) {
    for (let i = 0; i < types.length; i++) {
      const type = types[i];
      if (resultsLength < 6) {
        const nextResult = unfilteredResults[type][priorityPosition];
        if (nextResult) {
          results[type].push(nextResult);
          resultsLength += 1;
        }
      }
    }
    priorityPosition += 1;
  }
  return results;
};

const getResultsPreview = (searchTerm: string, state, params: SearchParams) => {
  let results;
  let types;
  const { communityScope, chainScope, isHomepageSearch } = params;
  if (communityScope || chainScope) {
    types = [SearchType.Discussion, SearchType.Member];
    results = getBalancedContentListing(app.searchCache[searchTerm], types);
  } else if (isHomepageSearch) {
    types = [SearchType.Community];
    results = getBalancedContentListing(app.searchCache[searchTerm], types);
  } else {
    types = [SearchType.Discussion, SearchType.Member, SearchType.Community];
    results = getBalancedContentListing(app.searchCache[searchTerm], types);
  }
  const organizedResults = [];
  let tabIndex = 1;
  types.forEach((type: SearchType) => {
    const res = results[type];
    if (res?.length === 0) return;
    const headerEle = m(ListItem, {
      label: type === SearchType.Community ? 'Communities' : `${capitalize(type)}s`,
      class: 'disabled',
      onclick: (e) => {
        e.preventDefault();
        e.stopPropagation();
      }
    });
    organizedResults.push(headerEle);
    (res as any[]).forEach((item) => {
      tabIndex += 1;
      const resultRow = item.searchType === SearchType.Discussion
        ? getDiscussionPreview(item, state.closeResults, searchTerm, tabIndex)
        : item.searchType === SearchType.Member
          ? getMemberPreview(item, state.closeResults, searchTerm, tabIndex, !!communityScope)
          : item.searchType === SearchType.Community
            ? getCommunityPreview(item, state.closeResults, tabIndex)
            : null;
      organizedResults.push(resultRow);
    });
  });
  return organizedResults;
};

const concludeSearch = (searchTerm: string, params: SearchParams, state, err?) => {
  if (!app.searchCache[searchTerm].loaded) {
    app.searchCache[searchTerm].loaded = true;
  }
  if (err) {
    state.results = {};
    state.errorText = (err.responseJSON?.error || err.responseText || err.toString());
  } else {
    state.results = params.isSearchPreview
      ? getResultsPreview(searchTerm, state, params)
      : app.searchCache[searchTerm];
  }
  m.redraw();
};

// Search makes the relevant queries, depending on whether the search is global or
// community-scoped. It then "concludesSearch," and either assigns the results to
// app.searchCache or sends them to getResultsPreview, which creates the relevant
// preview rows
export const search = async (searchTerm: string, params: SearchParams, state) => {
  const { isSearchPreview, isHomepageSearch, communityScope, chainScope } = params;
  const resultSize = isSearchPreview ? SEARCH_PREVIEW_SIZE : SEARCH_PAGE_SIZE;
  if (app.searchCache[searchTerm]?.loaded) {
    // If results exist in cache, conclude search
    concludeSearch(searchTerm, params, state);
  }
  try {
    if (!isHomepageSearch) {
      const [discussions, addrs] = await Promise.all([
        searchDiscussions(searchTerm, { resultSize, communityScope, chainScope }),
        searchMentionableAddresses(searchTerm, { resultSize, communityScope, chainScope }, ['created_at', 'DESC'])
      ]);

      app.searchCache[searchTerm][SearchType.Discussion] = discussions.map((discussion) => {
        discussion.contentType = discussion.root_id ? ContentType.Comment : ContentType.Thread;
        discussion.searchType = SearchType.Discussion;
        return discussion;
      }).sort(sortResults);

      app.searchCache[searchTerm][SearchType.Member] = addrs.map((addr) => {
        addr.contentType = ContentType.Member;
        addr.searchType = SearchType.Member;
        return addr;
      }).sort(sortResults);

      if (communityScope || chainScope) {
        concludeSearch(searchTerm, params, state);
        return;
      }
    }

    const unfilteredTokens = app.searchCache[ALL_RESULTS_KEY]['tokens'];
    const tokens = unfilteredTokens.filter((token) => token.name?.toLowerCase().includes(searchTerm));
    app.searchCache[searchTerm][SearchType.Community] = tokens.map((token) => {
      token.contentType = ContentType.Token;
      token.searchType = SearchType.Community;
      return token;
    });

    const allComms = app.searchCache[ALL_RESULTS_KEY]['communities'];
    const filteredComms = allComms.filter((comm) => {
      return comm.name?.toLowerCase().includes(searchTerm)
        || comm.symbol?.toLowerCase().includes(searchTerm);
    });
    app.searchCache[searchTerm][SearchType.Community] = app.searchCache[searchTerm][SearchType.Community]
      .concat(filteredComms.map((commOrChain) => {
        commOrChain.contentType = commOrChain.created_at ? ContentType.Community : ContentType.Chain;
        commOrChain.searchType = SearchType.Community;
        return commOrChain;
      })).sort(sortResults);

    concludeSearch(searchTerm, params, state);
  } catch (err) {
    concludeSearch(searchTerm, params, state, err);
  }
};

export const initializeSearch = async () => {
  // Pre-queries communities and tokens. Future searches merely filter from cached list,
  // to prevent unnecessary backend requests
  if (!app.searchCache[ALL_RESULTS_KEY]?.loaded) {
    app.searchCache[ALL_RESULTS_KEY] = {};
    try {
      const getTokens = () => $.getJSON('/api/getTokensFromLists')
        .then((response) => {
          if (response.status === 'Failure') {
            throw response.message;
          } else {
            return response.result;
          }
        });
      const [tokens, comms] = await Promise.all([getTokens(), searchChainsAndCommunities()]);
      app.searchCache[ALL_RESULTS_KEY]['tokens'] = tokens;
      app.searchCache[ALL_RESULTS_KEY]['communities'] = comms;
    } catch (err) {
      app.searchCache[ALL_RESULTS_KEY]['tokens'] = [];
      app.searchCache[ALL_RESULTS_KEY]['communities'] = [];
    }
    app.searchCache[ALL_RESULTS_KEY].loaded = true;
    m.redraw();
  }
};

const emptySearchPreview : m.Component<{ searchTerm: string }, {}> = {
  view: (vnode) => {
    const { searchTerm } = vnode.attrs;
    const message = app.activeId()
      ? `No results in ${app.activeId()}. Search Commonwealth?`
      : 'No communities found';
    return m(ListItem, {
      class: 'no-results',
      label: [
        m('b', searchTerm),
        m('span', message)
      ],
      onclick: (e) => {
        if (searchTerm.length < 4) {
          notifyError('Query must be at least 4 characters');
        }
        const params = `q=${encodeURIComponent(searchTerm.toString().trim())}`;
        m.route.set(`/search?${params}`);
      }
    });
  }
};

export const SearchBar : m.Component<{}, {
  results: any[],
  searchTerm: string,
  errorText: string,
  focused: boolean,
  closeResults: Function,
  hideResults: boolean,
  inputTimeout: any,
  isTyping: boolean,
}> = {
  view: (vnode) => {
    if (!vnode.state.searchTerm) vnode.state.searchTerm = '';

    const { results, searchTerm } = vnode.state;
    const showDropdownPreview = !m.route.get().includes('/search?q=');
    const isMobile = (window.innerWidth < 767.98);
    const LoadingPreview = m(List, {
      class: 'search-results-loading'
    }, [ m(ListItem, { label: m(Spinner, { active: true }) }) ]);
    const searchResults = (!results || results?.length === 0)
      ? (app.searchCache[searchTerm]?.loaded)
        ? m(List, [ m(emptySearchPreview, { searchTerm }) ])
        : LoadingPreview
      : vnode.state.isTyping
        ? LoadingPreview
        : m(List, { class: 'search-results-list' }, results);
    vnode.state.closeResults = () => { vnode.state.hideResults = true; };

    const chainOrCommIcon = app.activeId()
      ? app.activeChainId()
        ? m(ChainIcon, {
          size: 18,
          chain: app.chain.meta.chain,
        })
        : m(CommunityIcon, {
          size: 18,
          community: app.community.meta,
        })
      : null;
    const cancelInputIcon = vnode.state.searchTerm
      ? m(Icon, {
        name: Icons.X,
        onclick: () => {
          const input = $('.SearchBar').find('input[name=search');
          input.val('');
          vnode.state.searchTerm = '';
        } })
      : null;
    return m(ControlGroup, {
      class: 'SearchBar'
    }, [
      m(Input, {
        name: 'search',
        placeholder: 'Type to search...',
        autofocus: false, // !isMobile,
        fluid: true,
        tabIndex: -10,
        contentLeft: m(SearchIcon, {
          isMobile,
          intent: IconIntent.Primary,
        }),
        contentRight: cancelInputIcon || chainOrCommIcon,
        defaultValue: m.route.param('q') || vnode.state.searchTerm,
        value: vnode.state.searchTerm,
        autocomplete: 'off',
        oncreate: (e) => {
          initializeSearch();
        },
        onclick: async (e) => {
          vnode.state.focused = true;
        },
        oninput: (e) => {
          e.stopPropagation();
          vnode.state.isTyping = true;
          vnode.state.searchTerm = e.target.value?.toLowerCase();
          if (vnode.state.hideResults) {
            vnode.state.hideResults = false;
          }
          if (!app.searchCache[vnode.state.searchTerm]) {
            app.searchCache[vnode.state.searchTerm] = { loaded: false };
          }
          if (e.target.value?.length > 3) {
            const params: SearchParams = {
              isSearchPreview: true,
              communityScope: app.activeCommunityId(),
              chainScope: app.activeChainId(),
              isHomepageSearch: m.route.get() === '/'
            };
            clearTimeout(vnode.state.inputTimeout);
            vnode.state.inputTimeout = setTimeout(() => {
              vnode.state.isTyping = false;
              return search(vnode.state.searchTerm, params, vnode.state);
            }, 500);
          }
        },
        onkeyup: (e) => {
          e.stopPropagation();
          if (e.key === 'Enter') {
            if (!searchTerm || !searchTerm.toString().trim() || !searchTerm.match(/[A-Za-z]+/)) {
              notifyError('Enter a valid search term');
              return;
            }
            if (searchTerm.length < 4) {
              notifyError('Query must be at least 4 characters');
            }
            if (app.searchCache[searchTerm]?.loaded) {
              app.searchCache[searchTerm].loaded = false;
            }
            let params = `q=${encodeURIComponent(vnode.state.searchTerm.toString().trim())}`;
            if (app.activeCommunityId()) params += `&comm=${app.activeCommunityId()}`;
            else if (app.activeChainId()) params += `&chain=${app.activeChainId()}`;
            m.route.set(`/search?${params}`);
          }
        },
      }),
      searchTerm.length > 3
      && showDropdownPreview
      && !vnode.state.hideResults
      && searchResults
    ]);
  }
};

export default SearchBar;
