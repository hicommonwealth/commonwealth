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
  Button,
  Size,
  Tag,
} from 'construct-ui';
import { SearchIcon } from 'helpers/search';
import app from 'state';
import { notifyError } from 'controllers/app/notifications';
import { Profile, AddressInfo, SearchQuery } from 'models';
import { SearchScope } from 'models/SearchQuery'
import { ContentType, SearchType } from 'controllers/server/search';
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

const getSearchHistoryPreview = (searchQuery: SearchQuery, setFilterMenuActive, executeSearch) => {
  const scopeTags = searchQuery.searchScope[0] === SearchScope.ALL ? []
    : searchQuery.searchScope.map(scope => m(Tag, {label: SearchScope[scope].toLowerCase()}) )

  if(searchQuery.chainScope) {
    scopeTags.unshift(m(Tag, {
      label: searchQuery.chainScope.toLowerCase(),
      class: 'search-history-primary-tag'
    }))
  }

  if(searchQuery.communityScope) {
    scopeTags.unshift(m(Tag, {
      label: searchQuery.communityScope.toLowerCase(),
      class: 'search-history-primary-tag'
    }))
  }

  if(scopeTags.length > 1){
    scopeTags.splice(-1, 0, m('p.search-history-tag-seperator', 'and'))
  }

  if(scopeTags.length >= 1){
    scopeTags.unshift(m(Icon, {name: Icons.ARROW_RIGHT }))
  }

  return m(ListItem, {
    class: 'search-history-item',
    onclick: () => {
      app.search.removeFromHistory(searchQuery)
      executeSearch(searchQuery)
    },
    onmouseover: () => {setFilterMenuActive(true)},
    onmouseout: () => {setFilterMenuActive(false)},
    contentLeft: [
      m('p.search-history-query', searchQuery.searchTerm),
      scopeTags
    ],
    contentRight: m(Icon, {
        name: Icons.X,
        onclick: () => {app.search.removeFromHistory(searchQuery)}
      })
  })
}

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
    filterMenuActive: boolean;
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
    const isMobile = window.innerWidth < 767.98;

    const setFilterMenuActive = (using: boolean) => {
      vnode.state.filterMenuActive = using
    }

    vnode.state.closeResults = () => {
      vnode.state.hideResults = true;
    };

    const executeSearch = (query: SearchQuery) => {
      if (
        !query.searchTerm ||
        !query.searchTerm.toString().trim() ||
        !query.searchTerm.match(/[A-Za-z]+/)
      ) {
        notifyError('Enter a valid search term');
        return;
      }
      if (query.searchTerm.length < 4) {
        notifyError('Query must be at least 4 characters');
      }
      query.isSearchPreview = false;
      app.search.addToHistory(query)
      m.route.set(`/search?${query.toUrlParams()}`);
    }

    const historyList = app.search.getHistory()
      .map(h => getSearchHistoryPreview(h, setFilterMenuActive, executeSearch))

    const activeCommunity = app.community ? app.community.name : vnode.state.searchQuery.communityScope
    const activeChain = app.activeChainId() || vnode.state.searchQuery.chainScope
    const scopeTitle = m(ListItem, {class: 'disabled', label: 'Scope'})

    const filterDropdown =
      m(List, {
        class: 'search-results-list',
      }, [
        activeCommunity ? [scopeTitle, m(ListItem, {
          class: 'disabled',
          label: m(Button, {
            size: Size.LG,
            onclick: () => { vnode.state.searchQuery.communityScope = activeCommunity },
            active: vnode.state.searchQuery.communityScope === activeCommunity,
            onmouseover: () => {vnode.state.filterMenuActive = true},
            onmouseout: () => {vnode.state.filterMenuActive = false},
            label: `Search inside community: ${activeCommunity}`
          }),
        })] :
        app.activeChainId() && [scopeTitle, m(ListItem, {
          class: 'disabled',
          label: m(Button, {
            size: Size.LG,
            onclick: () => { vnode.state.searchQuery.chainScope = activeChain },
            active: vnode.state.searchQuery.chainScope === activeChain ,
            onmouseover: () => {vnode.state.filterMenuActive = true},
            onmouseout: () => {vnode.state.filterMenuActive = false},
            label: `Search inside chain: ${activeChain}`
          }),
        })],
        m(ListItem, {
          class: 'disabled',
          label: "I'm looking for: "
        }),
        m(ListItem, {
          class: 'disabled bottom-border search-filter-button-bar',
          label: [
            m(Button, {
              size: Size.LG,
              active: vnode.state.searchQuery.searchScope.includes(SearchScope.THREADS),
              onclick: () => {vnode.state.searchQuery.toggleScope(SearchScope.THREADS)},
              onmouseover: () => {vnode.state.filterMenuActive = true},
              onmouseout: () => {vnode.state.filterMenuActive = false},
              label: 'Threads'
            }),
            m(Button, {
              size: Size.LG,
              active: vnode.state.searchQuery.searchScope.includes(SearchScope.COMMENTS),
              onclick: () => vnode.state.searchQuery.toggleScope(SearchScope.COMMENTS),
              onmouseover: () => {vnode.state.filterMenuActive = true},
              onmouseout: () => {vnode.state.filterMenuActive = false},
              label: 'Replies'
            }),
            m(Button, {
              size: Size.LG,
              active: vnode.state.searchQuery.searchScope.includes(SearchScope.MEMBERS),
              onclick: () => vnode.state.searchQuery.toggleScope(SearchScope.MEMBERS),
              onmouseover: () => {vnode.state.filterMenuActive = true},
              onmouseout: () => {vnode.state.filterMenuActive = false},
              label: 'Members'
            }),
            m(Button, {
              size: Size.LG,
              active: vnode.state.searchQuery.searchScope.includes(SearchScope.COMMUNITIES),
              onclick: () => vnode.state.searchQuery.toggleScope(SearchScope.COMMUNITIES),
              onmouseover: () => {vnode.state.filterMenuActive = true},
              onmouseout: () => {vnode.state.filterMenuActive = false},
              label: 'Communities'
            }),
        ]}),
        vnode.state.searchTerm.length < 1 ?
          historyList.length === 0
          ? m(ListItem, {class: 'search-history-no-results',
                         label: 'Enter a term into the field and press Enter to start' })
          : [m(ListItem, {class: 'disabled', label: 'Search History' }), historyList]
          : !results || results?.length === 0
            ? app.search.getByQuery(searchQuery)?.loaded
              ? m(ListItem, [m(emptySearchPreview, { searchTerm })])
              : m(ListItem, { label: m(Spinner, { active: true }) })
            : vnode.state.isTyping
            ? m(ListItem, { label: m(Spinner, { active: true }) })
            : results
      ])

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

    const searchIcon = vnode.state.searchTerm
      ? m(Icon, {
          name: Icons.CORNER_DOWN_LEFT,
          onclick: () => {
            executeSearch(vnode.state.searchQuery)
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
          onfocusout: () => {
            if(!vnode.state.filterMenuActive) vnode.state.focused = false;
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
              executeSearch(vnode.state.searchQuery)
            }
          },
        }),
        vnode.state.focused && !vnode.state.hideResults && filterDropdown
      ]
    );
  },
};

export default SearchBar;
