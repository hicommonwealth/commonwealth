/* eslint-disable @typescript-eslint/ban-types */
import 'pages/search.scss';

import m from 'mithril';
import $ from 'jquery';
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
import app from 'state';
import { getProposalUrlPath } from 'identifiers';
import { ProposalType } from 'types';
import { notifyError } from 'controllers/app/notifications';
import { Profile, AddressInfo, SearchQuery } from 'models';
import { SearchScope } from 'models/SearchQuery';
import { ContentType } from 'controllers/server/search';
import moment from 'moment';
import MarkdownFormattedText from './markdown_formatted_text';
import QuillFormattedText from './quill_formatted_text';
import User, { UserBlock } from './widgets/user';
import { ChainIcon } from './chain_icon';
import { CommunityLabel } from './community_label';

export const getMemberPreview = (
  addr,
  closeResultsFn,
  searchTerm,
  tabIndex,
  setUsingFilterMenuFn,
  showChainName?
) => {
  const profile: Profile = app.profiles.getProfile(addr.chain, addr.address);
  if (addr.name) profile.initialize(addr.name, null, null, null, null);
  const userLink = `${
    app.isCustomDomain() ? '' : `/${app.activeChainId() || addr.chain}`
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
    onmouseover: () => setUsingFilterMenuFn(true),
    onmouseout: () => setUsingFilterMenuFn(false),
  });
};

export const getCommunityPreview = (
  community,
  closeResultsFn,
  tabIndex,
  setUsingFilterMenuFn
) => {
  const params =
    community.contentType === ContentType.Token
      ? { token: community }
      : community.contentType === ContentType.Chain
      ? { chain: community }
      : null;

  params['size'] = 36;

  const onSelect = () => {
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
        onSelect();
      }
    },
    onmouseover: () => setUsingFilterMenuFn(true),
    onmouseout: () => setUsingFilterMenuFn(false),
  });
};

export const getDiscussionPreview = (
  thread,
  closeResultsFn,
  searchTerm,
  tabIndex,
  setUsingFilterMenuFn
) => {
  const proposalId = thread.proposalid;
  const chainOrComm = thread.chain || thread.offchain_community;
  const onSelect = (e) => {
    if (!chainOrComm) {
      notifyError('Discussion not found.');
      return;
    }

    const path = getProposalUrlPath(ProposalType.OffchainThread, proposalId, false, chainOrComm);
    m.route.set(path);
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
    onmouseover: () => setUsingFilterMenuFn(true),
    onmouseout: () => setUsingFilterMenuFn(false),
    label: m('a.search-results-item', [
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

export const getCommentPreview = (
  comment,
  closeResultsFn,
  searchTerm,
  tabIndex,
  setUsingFilterMenuFn
) => {
  const proposalId = comment.proposalid;
  const chainOrComm = comment.chain || comment.offchain_community;
  const onSelect = (e) => {
    if (!chainOrComm) {
      notifyError('Discussion not found.');
      return;
    }

    const [slug, id] = proposalId.split('_');
    const path = getProposalUrlPath(slug, id, false, chainOrComm);
    m.route.set(path);
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
    onmouseover: () => setUsingFilterMenuFn(true),
    onmouseout: () => setUsingFilterMenuFn(false),
    label: m('a.search-results-item', [
      [
        m('.search-results-thread-title', [
          'Comment on ',
          decodeURIComponent(comment.title),
        ]),
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
      ],
    ]),
  });
};

const getBalancedContentListing = (
  unfilteredResults: Record<any, any>,
  types: SearchScope[]
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
  // TODO: using chainScope instead of communityScope OK?
  const { chainScope } = searchQuery;
  const types = searchQuery.getSearchScope();
  const results = getBalancedContentListing(
    app.search.getByQuery(searchQuery).results,
    types
  );
  const organizedResults = [];
  let tabIndex = 1;
  types.forEach((type: SearchScope) => {
    const res = results[type];
    if (res?.length === 0) return;
    const headerEle = m(ListItem, {
      label: type,
      class: `disabled ${organizedResults.length === 0 ? 'upper-border' : ''}`,
      onclick: (e) => {
        e.preventDefault();
        e.stopPropagation();
      },
    });
    organizedResults.push(headerEle);
    (res as any[]).forEach((item) => {
      tabIndex += 1;
      const resultRow =
        item.searchType === SearchScope.Threads
          ? getDiscussionPreview(
              item,
              state.closeResults,
              searchQuery.searchTerm,
              tabIndex,
              state.setUsingFilterMenu
            )
          : item.searchType === SearchScope.Members
          ? getMemberPreview(
              item,
              state.closeResults,
              searchQuery.searchTerm,
              tabIndex,
              state.setUsingFilterMenu,
              !!chainScope
            )
          : item.searchType === SearchScope.Communities
          ? getCommunityPreview(
              item,
              state.closeResults,
              tabIndex,
              state.setUsingFilterMenu
            )
          : item.searchType === SearchScope.Replies
          ? getCommentPreview(
              item,
              state.closeResults,
              searchQuery.searchTerm,
              tabIndex,
              state.setUsingFilterMenu
            )
          : null;
      organizedResults.push(resultRow);
    });
  });
  return organizedResults;
};

const getSearchHistoryPreview = (
  searchQuery: SearchQuery,
  setFilterMenuActive,
  executeSearch
) => {
  const scopeTags =
    searchQuery.searchScope[0] === SearchScope.All
      ? []
      : searchQuery.searchScope.map((scope) =>
          m(Tag, { label: SearchScope[scope].toLowerCase() })
        );

  if (searchQuery.chainScope && !app.isCustomDomain()) {
    scopeTags.unshift(
      m(Tag, {
        label: searchQuery.chainScope.toLowerCase(),
        class: 'search-history-primary-tag',
      })
    );
  }

  if (scopeTags.length > 1) {
    scopeTags.splice(-1, 0, m('p.search-history-tag-seperator', 'and'));
  }

  if (scopeTags.length >= 1) {
    scopeTags.unshift(m(Icon, { name: Icons.ARROW_RIGHT }));
  }

  return m(ListItem, {
    class: 'search-history-item',
    onclick: () => {
      app.search.removeFromHistory(searchQuery);
      executeSearch(searchQuery);
    },
    onmouseover: () => {
      setFilterMenuActive(true);
    },
    onmouseout: () => {
      setFilterMenuActive(false);
    },
    contentLeft: [
      m('p.search-history-query', searchQuery.searchTerm),
      scopeTags,
    ],
    contentRight: m(Icon, {
      name: Icons.X,
      onclick: () => {
        app.search.removeFromHistory(searchQuery);
      },
    }),
  });
};

export const search = async (searchQuery: SearchQuery, state) => {
  try {
    await app.search.search(searchQuery);
  } catch (err) {
    console.error(err);
    state.results = {};
    state.errorText =
      err.responseJSON?.error || err.responseText || err.toString();
  }
  state.results = searchQuery.isSearchPreview
    ? getResultsPreview(searchQuery, state)
    : app.search.getByQuery(searchQuery).results;
  m.redraw();
};

export const executeSearch = (query: SearchQuery) => {
  if (!query.searchTerm || !query.searchTerm.toString().trim()) {
    notifyError('Enter a valid search term');
    return;
  }
  if (query.searchTerm.length < 4) {
    notifyError('Query must be at least 4 characters');
  }
  query.isSearchPreview = false;
  app.search.addToHistory(query);
  m.route.set(`/search?${query.toUrlParams()}`);
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
    setUsingFilterMenu: Function;
    searchQuery: SearchQuery;
    activeCommunity: string;
    activeChain: string;
  }
> = {
  view: (vnode) => {
    if (!vnode.state.searchTerm) vnode.state.searchTerm = '';
    if (!vnode.state.searchQuery) {
      vnode.state.searchQuery = m.route.get().startsWith('/search')
        ? SearchQuery.fromUrlParams(m.route.param())
        : new SearchQuery('', {
            isSearchPreview: true,
            chainScope: app.activeChainId(),
          });
      vnode.state.activeChain = app.activeChainId()
        ? app.activeChainId()
        : vnode.state.searchQuery.chainScope;
      vnode.state.isTyping = false;
    }
    if (
      vnode.state.searchQuery.searchTerm !== vnode.state.searchTerm &&
      vnode.state.searchTerm.length > 3
    ) {
      vnode.state.searchQuery.searchTerm = vnode.state.searchTerm;
    }
    const { results, searchQuery } = vnode.state;
    const isMobile = window.innerWidth < 767.98;

    const setFilterMenuActive = (using: boolean) => {
      vnode.state.filterMenuActive = using;
    };

    vnode.state.closeResults = () => {
      vnode.state.hideResults = true;
    };

    vnode.state.setUsingFilterMenu = (using) => {
      vnode.state.filterMenuActive = using;
    };

    const historyList = app.search
      .getHistory()
      .map((h) =>
        getSearchHistoryPreview(h, setFilterMenuActive, executeSearch)
      );

    if (historyList.length > 0) {
      historyList.push(
        m(ListItem, {
          class: 'search-history-no-results upper-border',
          label:
            'Tip: You can use operators like \'single quotes\', and the keyword "or" to limit your search!',
        })
      );
    }

    const scopeTitle = m(ListItem, {
      class: 'disabled',
      label: 'Limit search to:',
    });

    const scopeToButton = (scope, disabled) => {
      return m(Button, {
        size: Size.SM,
        class: `${disabled ? 'disabled' : ''}`,
        active: vnode.state.searchQuery.searchScope.includes(scope),
        onclick: () => {
          vnode.state.searchQuery.toggleScope(scope);
          search(vnode.state.searchQuery, vnode.state);
        },
        onmouseover: () => {
          vnode.state.filterMenuActive = true;
        },
        onmouseout: () => {
          vnode.state.filterMenuActive = false;
        },
        label: scope,
      });
    };

    const scopeButtons = [SearchScope.Threads, SearchScope.Replies]
      .map((s) => scopeToButton(s, false))
      .concat(
        (app.isCustomDomain()
          ? []
          : [SearchScope.Communities, SearchScope.Members]
        ).map((s) => scopeToButton(s, vnode.state.searchQuery.chainScope))
      );

    const filterDropdown = m(
      List,
      {
        class: 'search-results-list',
      },
      [
        m(ListItem, {
          class: 'disabled',
          label: "I'm looking for: ",
        }),
        m(ListItem, {
          class: 'disabled search-filter-button-bar',
          label: scopeButtons,
        }),
        vnode.state.activeChain &&
          !app.isCustomDomain() && [
            scopeTitle,
            m(ListItem, {
              class: 'disabled',
              label: m(Button, {
                size: Size.SM,
                onclick: () => {
                  vnode.state.searchQuery.chainScope =
                    vnode.state.searchQuery.chainScope ===
                    vnode.state.activeChain
                      ? undefined
                      : vnode.state.activeChain;
                  search(vnode.state.searchQuery, vnode.state);
                },
                active:
                  vnode.state.searchQuery.chainScope ===
                  vnode.state.activeChain,
                onmouseover: () => {
                  vnode.state.filterMenuActive = true;
                },
                onmouseout: () => {
                  vnode.state.filterMenuActive = false;
                },
                label: `Inside chain: ${vnode.state.activeChain}`,
              }),
            }),
          ],
        vnode.state.searchTerm.length < 1
          ? historyList.length === 0
            ? m(ListItem, {
                class: 'search-history-no-results upper-border',
                label: 'Enter a term into the field and press Enter to start',
              })
            : [
                m(ListItem, {
                  class: 'disabled upper-border',
                  label: 'Search History',
                }),
                historyList,
              ]
          : !results || results?.length === 0
          ? app.search.getByQuery(searchQuery)?.loaded
            ? m(ListItem, {
                class: 'search-history-no-results upper-border',
                label: 'No Results Found',
              })
            : vnode.state.isTyping
            ? m(ListItem, {
                class: 'disabled upper-border',
                label: m(Spinner, { active: true }),
              })
            : m(ListItem, {
                class: 'search-history-no-results upper-border',
                label: 'Make your query longer than 3 characters to search',
              })
          : vnode.state.isTyping
          ? m(ListItem, {
              class: 'disabled upper-border',
              label: m(Spinner, { active: true }),
            })
          : results,
      ]
    );

    const chainOrCommIcon = app.activeChainId()
      ? m(ChainIcon, {
          size: 18,
          chain: app.chain.meta.chain,
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
            executeSearch(vnode.state.searchQuery);
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
          // TODO Gabe 1/24/22 - Pre-JSX icon wasn't rendering at all and
          // JSX icon looks really bad with gradient styling, so I'm leaving it out for now
          //
          // contentLeft: m(CWIcon, {
          //   isMobile,
          //   iconName: 'search',
          // }),
          contentRight: vnode.state.searchTerm
            ? m(ControlGroup, {}, [cancelInputIcon, searchIcon])
            : chainOrCommIcon,
          defaultValue: m.route.param('q') || vnode.state.searchTerm,
          value: vnode.state.searchTerm,
          autocomplete: 'off',
          oncreate: (e) => {
            app.search.initialize();
          },
          onclick: async (e) => {
            vnode.state.focused = true;
          },
          onfocusout: () => {
            if (!vnode.state.filterMenuActive) vnode.state.focused = false;
          },
          oninput: (e) => {
            e.stopPropagation();
            vnode.state.isTyping = true;
            vnode.state.focused = true;
            vnode.state.searchTerm = e.target.value?.toLowerCase();
            clearTimeout(vnode.state.inputTimeout);
            const timeout = e.target.value?.length > 3 ? 250 : 1000;
            vnode.state.inputTimeout = setTimeout(() => {
              vnode.state.isTyping = false;
              if (e.target.value?.length > 3) {
                search(vnode.state.searchQuery, vnode.state);
              } else {
                vnode.state.searchQuery.searchTerm =
                  e.target.value?.toLowerCase();
                vnode.state.results = [];
                m.redraw();
              }
            }, timeout);
          },
          onkeyup: (e) => {
            e.stopPropagation();
            if (e.key === 'Enter') {
              executeSearch(vnode.state.searchQuery);
            }
          },
        }),
        vnode.state.focused && !vnode.state.hideResults && filterDropdown,
      ]
    );
  },
};

export default SearchBar;
