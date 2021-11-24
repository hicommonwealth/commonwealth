import 'pages/search.scss';

import m from 'mithril';
import $ from 'jquery';
import _, { capitalize } from 'lodash';
import {
  ControlGroup,
  Icon,
  Icons,
  Input,
  List,
  ListItem,
  Spinner,
} from 'construct-ui';
import { SearchIcon } from 'helpers/search';
import app from 'state';
import { notifyError } from 'controllers/app/notifications';
import { Profile, AddressInfo, SearchQuery } from 'models';
import { SearchScope } from 'models/SearchQuery'
import { ContentType, SearchType, SearchParams } from 'controllers/server/search';
import moment from 'moment';
import MarkdownFormattedText from './markdown_formatted_text';
import QuillFormattedText from './quill_formatted_text';
import { CommunityLabel } from './sidebar/community_selector';
import User, { UserBlock } from './widgets/user';
import { ChainIcon, CommunityIcon } from './chain_icon';

export const getMemberPreview = (
  addr,
  closeResultsFn,
  searchTerm,
  tabIndex,
  showChainName?
) => {
  const profile: Profile = app.profiles.getProfile(addr.chain, addr.address);
  if (addr.name) profile.initialize(addr.name, null, null, null, null);
  const userLink = `${
    app.isCustomDomain() ? '' : `/${app.activeId() || addr.chain}`
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
    },
  });
};

export const getCommunityPreview = (community, closeResultsFn, tabIndex) => {
  const params =
    community.contentType === ContentType.Token
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
    },
  });
};

export const getDiscussionPreview = (
  thread,
  closeResultsFn,
  searchTerm,
  tabIndex
) => {
  const proposalId = thread.proposalid;
  const chainOrComm = thread.chain || thread.offchain_community;
  const onSelect = (e) => {
    if (!chainOrComm) {
      notifyError('Discussion not found.');
      return;
    }
    m.route.set(
      thread.type === 'thread'
        ? `/${chainOrComm}/proposal/discussion/${proposalId}`
        : `/${chainOrComm}/proposal/${proposalId.split('_')[0]}/${
            proposalId.split('_')[1]
          }`
    );
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
      thread.type === 'thread'
        ? [
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
            ]),
          ]
        : [
            m('.search-results-thread-title', [
              'Comment on ',
              decodeURIComponent(thread.title),
            ]),
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
            m('.search-results-comment', [
              (() => {
                try {
                  const doc = JSON.parse(decodeURIComponent(thread.text));
                  if (!doc.ops) throw new Error();
                  return m(QuillFormattedText, {
                    doc,
                    hideFormatting: true,
                    collapse: true,
                    searchTerm,
                  });
                } catch (e) {
                  const doc = decodeURIComponent(thread.text);
                  return m(MarkdownFormattedText, {
                    doc,
                    hideFormatting: true,
                    collapse: true,
                    searchTerm,
                  });
                }
              })(),
            ]),
          ],
    ]),
  });
};

const getBalancedContentListing = (
  unfilteredResults: Record<any, any>,
  types: SearchType[]
) => {
  const results = {};
  let unfilteredResultsLength = 0;
  for (const key of types) {
    results[key] = [];
    unfilteredResultsLength += unfilteredResults[key]?.length || 0;
  }
  let priorityPosition = 0;
  let resultsLength = 0;
  while (resultsLength < 6 && resultsLength < unfilteredResultsLength) {
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

const getResultsPreview = (searchQuery: SearchQuery, state) => {
  let results;
  let types;
  const { communityScope, chainScope, isHomepageSearch } = searchQuery;
  if (communityScope || chainScope) {
    types = [SearchType.Discussion, SearchType.Member];
    results = getBalancedContentListing(app.search.getByQuery(searchQuery).results, types);
  } else if (isHomepageSearch) {
    types = [SearchType.Community];
    results = getBalancedContentListing(app.search.getByQuery(searchQuery).results, types);
  } else {
    types = [SearchType.Discussion, SearchType.Member, SearchType.Community];
    results = getBalancedContentListing(app.search.getByQuery(searchQuery).results, types);
  }
  const organizedResults = [];
  let tabIndex = 1;
  types.forEach((type: SearchType) => {
    const res = results[type];
    if (res?.length === 0) return;
    const headerEle = m(ListItem, {
      label:
        type === SearchType.Community ? 'Communities' : `${capitalize(type)}s`,
      class: 'disabled',
      onclick: (e) => {
        e.preventDefault();
        e.stopPropagation();
      },
    });
    organizedResults.push(headerEle);
    (res as any[]).forEach((item) => {
      tabIndex += 1;
      const resultRow =
        item.searchType === SearchType.Discussion
          ? getDiscussionPreview(item, state.closeResults, searchQuery.searchTerm, tabIndex)
          : item.searchType === SearchType.Member
          ? getMemberPreview(
              item,
              state.closeResults,
              searchQuery.searchTerm,
              tabIndex,
              !!communityScope
            )
          : item.searchType === SearchType.Community
          ? getCommunityPreview(item, state.closeResults, tabIndex)
          : null;
      organizedResults.push(resultRow);
    });
  });
  return organizedResults;
};

export const search = async (
  searchQuery: SearchQuery,
  state,
) => {
  try {
    await app.search.search(searchQuery)
  }
  catch (err) {
    console.error(err)
    state.results = {};
    state.errorText =
      err.responseJSON?.error || err.responseText || err.toString();
  }
  state.results = searchQuery.isSearchPreview
    ? getResultsPreview(searchQuery, state)
    : app.search.getByQuery(searchQuery).results;
  m.redraw();
};

const emptySearchPreview: m.Component<{ searchTerm: string }, {}> = {
  view: (vnode) => {
    const { searchTerm } = vnode.attrs;
    const message = app.activeId()
      ? `No results in ${app.activeId()}. Search Commonwealth?`
      : 'No communities found';
    return m(ListItem, {
      class: 'no-results',
      label: [m('b', searchTerm), m('span', message)],
      onclick: (e) => {
        if (searchTerm.length < 4) {
          notifyError('Query must be at least 4 characters');
        }
        const params = `q=${encodeURIComponent(searchTerm.toString().trim())}`;
        m.route.set(`/search?${params}`);
      },
    });
  },
};

export const SearchBar: m.Component<
  {},
  {
    results: any[];
    searchTerm: string;
    errorText: string;
    focused: boolean;
    closeResults: Function;
    hideResults: boolean;
    inputTimeout: any;
    isTyping: boolean;
    searchQuery: SearchQuery;
  }
> = {
  view: (vnode) => {
    if (!vnode.state.searchTerm) vnode.state.searchTerm = '';
    if (!vnode.state.searchQuery) vnode.state.searchQuery = new SearchQuery('', { isSearchPreview: true });
    if (vnode.state.searchQuery.searchTerm !== vnode.state.searchTerm && vnode.state.searchTerm.length > 3) {
      vnode.state.searchQuery.searchTerm = vnode.state.searchTerm
    }
    const { results, searchTerm, searchQuery } = vnode.state;
    const showDropdownPreview = !m.route.get().includes('/search?q=');
    const isMobile = window.innerWidth < 767.98;
    const LoadingPreview = m(
      List,
      {
        class: 'search-results-loading',
      },
      [m(ListItem, { label: m(Spinner, { active: true }) })]
    );
    const searchResults =
      !results || results?.length === 0
        ? app.search.getByQuery(searchQuery)?.loaded
          ? m(List, [m(emptySearchPreview, { searchTerm })])
          : LoadingPreview
        : vnode.state.isTyping
        ? LoadingPreview
        : m(List, { class: 'search-results-list' }, results);

    const instructions =
      m(List, { class: 'search-results-list' }, [
        app.community ? m(ListItem, {
          label: m('a.search-results-item', `Search inside chain: ${app.community.name}`),
          onclick: () => { vnode.state.searchQuery.communityScope = app.community.name }
        }) :
        app.activeId() && m(ListItem, {
          label: m('a.search-results-item', `Search inside chain: ${app.activeChainId()}`),
          onclick: () => {vnode.state.searchQuery.chainScope = app.activeChainId()}
        }),
        m(ListItem, {
          class: 'disabled',
          label: "I'm looking for: "
        }),
        m(ListItem, {
          label: "Replies",
          onclick: () => {vnode.state.searchQuery.toggleScope(SearchScope.COMMENTS)}
        }),
        m(ListItem, {
          label: "Proposals",
          onclick: () => {vnode.state.searchQuery.toggleScope(SearchScope.PROPOSALS)}
        }),
        m(ListItem, {
          label: "Threads",
          onclick: () => {vnode.state.searchQuery.toggleScope(SearchScope.THREADS)}
        }),
      ])

    vnode.state.closeResults = () => {
      vnode.state.hideResults = true;
    };

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
          },
        })
      : null;

    const executeSearch = () => {
      if (
        !vnode.state.searchQuery.searchTerm ||
        !vnode.state.searchQuery.searchTerm.toString().trim() ||
        !vnode.state.searchQuery.searchTerm.match(/[A-Za-z]+/)
      ) {
        notifyError('Enter a valid search term');
        return;
      }
      if (vnode.state.searchQuery.searchTerm.length < 4) {
        notifyError('Query must be at least 4 characters');
      }
      vnode.state.searchQuery.isSearchPreview = false;
      m.route.set(`/search?${vnode.state.searchQuery.toUrlParams()}`);
    }

    const searchIcon = vnode.state.searchTerm
      ? m(Icon, {
          name: Icons.CORNER_DOWN_LEFT,
          onclick: () => {
            executeSearch()
          },
        })
      : null;

    return m(
      ControlGroup,
      {
        class: 'SearchBar',
      },
      [
        m(Input, {
          name: 'search',
          placeholder: 'Type to search...',
          autofocus: false, // !isMobile,
          fluid: true,
          tabIndex: -10,
          contentLeft: m(SearchIcon, { isMobile }),
          contentRight: vnode.state.searchTerm ? m(ControlGroup, {}, [searchIcon, cancelInputIcon]) : chainOrCommIcon,
          defaultValue: m.route.param('q') || vnode.state.searchTerm,
          value: vnode.state.searchTerm,
          autocomplete: 'off',
          oncreate: (e) => {
            app.search.initialize();
          },
          onclick: async (e) => {
            vnode.state.focused = true;
            vnode.state.hideResults = false;
          },
          oninput: (e) => {
            e.stopPropagation();
            vnode.state.isTyping = true;
            vnode.state.searchTerm = e.target.value?.toLowerCase();
            if (vnode.state.hideResults) {
              vnode.state.hideResults = false;
            }
            if (e.target.value?.length > 3) {
              clearTimeout(vnode.state.inputTimeout);
              vnode.state.inputTimeout = setTimeout(() => {
                vnode.state.isTyping = false;
                return search(vnode.state.searchQuery, vnode.state);
              }, 500);
            }
          },
          onkeyup: (e) => {
            e.stopPropagation();
            if (e.key === 'Enter') {
              executeSearch()
            }
          },
        }),
        searchTerm.length > 3 &&
          showDropdownPreview &&
          !vnode.state.hideResults &&
          searchResults,
        vnode.state.focused && !vnode.state.hideResults && searchTerm.length < 3 && instructions
      ]
    );
  },
};

export default SearchBar;
