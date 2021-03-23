import 'pages/search.scss';

import $ from 'jquery';
import m from 'mithril';
import _ from 'lodash';
import moment from 'moment-twitter';
import { Input, Spinner, Tag } from 'construct-ui';

import { pluralize } from 'helpers';
import app from 'state';
import { AddressInfo } from 'models';

import QuillFormattedText from 'views/components/quill_formatted_text';
import MarkdownFormattedText from 'views/components/markdown_formatted_text';
import User from 'views/components/widgets/user';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';

const SEARCH_DELAY = 750;
const SEARCH_RESULTS_SIZE = 10;

export enum SearchPrefixes {
  COMMUNITY = 'comm:',
  MENTION = 'mention:',
  TOKEN = 'token:',
  USER = 'user:'
}

const searchCache = {}; // only used to restore search results when returning to the page

export const search = _.debounce((searchTerm, vnode) => {
  vnode.state.searchTerm = searchTerm;

  const chainId = app.activeChainId();
  const communityId = app.activeCommunityId();
  const params = {
    chain: chainId,
    community: communityId,
    cutoff_date: null, // cutoffDate.toISOString(),
    search: searchTerm,
    results_size: SEARCH_RESULTS_SIZE,
  };
  $.get(`${app.serverUrl()}/search`, params).then((response) => {
    if (response.status !== 'Success') {
      vnode.state.searchLoading = false;
      m.redraw();
      return;
    }
    vnode.state.results = response.response;
    searchCache[searchTerm] = response.response;
    vnode.state.searchLoading = false;
    m.redraw();
  }).catch((err: any) => {
    vnode.state.searchLoading = false;
    vnode.state.errorText = err.responseJSON?.error || err.responseText || err.toString();
    m.redraw();
  });
}, SEARCH_DELAY);

const SearchBar : m.Component<{}, {
  results: any[],
  searchLoading: boolean,
  searchTerm: string,
  searchPrefix: string,
  overridePrefix: boolean,
  errorText: string,
  focused: boolean,
}> = {
  view: (vnode) => {
    if (!app.chain && !app.community) {
      return;
    }

    const contentLeft = (vnode.state.searchPrefix?.length && !vnode.state.overridePrefix)
      ? m('.search-prefix', vnode.state.searchPrefix) : null;
    const klass = vnode.state.focused ? '.SearchBar.focused' : '.SearchBar';

    return m(klass, [
      m(Input, {
        placeholder: 'Type to search...',
        autofocus: true,
        fluid: true,
        defaultValue: m.route.param('q'),
        onclick: (e) => {
          vnode.state.focused = true;
          if (!vnode.state.overridePrefix) {
            vnode.state.searchPrefix = SearchPrefixes.COMMUNITY;
          }
        },
        contentLeft,
        oninput: (e) => {
          const searchTerm = e.target.value;
          if (!searchTerm || !searchTerm.toString().trim() || !searchTerm.match(/[A-Za-z]+/)) {
            vnode.state.errorText = 'Enter a valid search term';
            vnode.state.searchLoading = false;
            return;
          }
          vnode.state.errorText = null;
          if (searchTerm.length < 3) {
            return;
          }
          vnode.state.searchLoading = true;
          search(e.target.value, vnode);
        }
        // on enter
        // m.route.set(`/${app.activeId()}/search?q=${encodeURIComponent(searchTerm.toString().trim())}`);
      }),
      m('.search-results-wrap', [
        vnode.state.searchLoading ? m('.search-loading', [
          m(Spinner, {
            active: true,
            fill: true,
            size: 'xl',
          }),
        ]) : vnode.state.errorText ? m('.search-error', [
          m('.error-text', vnode.state.errorText),
        ]) : !vnode.state.results ? m('.search-loading', [
          // TODO: prompt to start searching
        ]) : m('.search-results', [
          m('.search-results-caption', [
            vnode.state.results.length === SEARCH_RESULTS_SIZE
              ? `${vnode.state.results.length}+ results`
              : pluralize(vnode.state.results.length, 'result'),
            ' for \'',
            vnode.state.searchTerm,
            '\'',
            m('a.search-results-clear', {
              href: '#',
              onclick: (e) => {
                e.preventDefault();
                e.stopPropagation();
                vnode.state.results = null;
                $('.search-page-input input').val('')
                  .select()
                  .focus();
              }
            }, 'Clear'),
          ]),
          m('.search-results-list', [
            vnode.state.results.map((result) => {
              const activeId = app.activeId();
              const proposalType = result.proposalType;
              const proposalId = result.proposalid;
              return m('a.search-results-item', {
                href: (result.type === 'thread')
                  ? `/${activeId}/proposal/discussion/${proposalId}`
                  : `/${activeId}/proposal/${proposalId.split('_')[0]}/${proposalId.split('_')[1]}`,
                onclick: (e) => {
                  e.preventDefault();
                  m.route.set(
                    result.type === 'thread'
                      ? `/${activeId}/proposal/discussion/${proposalId}`
                      : `/${activeId}/proposal/${proposalId.split('_')[0]}/${proposalId.split('_')[1]}`
                  );
                }
              }, [
                result.type === 'thread' ? [
                  m('.search-results-thread-title', [
                    decodeURIComponent(result.title),
                  ]),
                  m('.search-results-thread-subtitle', [
                    m('span.created-at', moment(result.created_at).fromNow()),
                    m(User, { user: new AddressInfo(result.address_id, result.address, result.address_chain, null) }),
                  ]),
                  m('.search-results-thread-body', [
                    (() => {
                      try {
                        const doc = JSON.parse(decodeURIComponent(result.body));
                        if (!doc.ops) throw new Error();
                        return m(QuillFormattedText, {
                          doc,
                          hideFormatting: true,
                          collapse: true,
                          searchTerm: vnode.state.searchTerm,
                        });
                      } catch (e) {
                        const doc = decodeURIComponent(result.body);
                        return m(MarkdownFormattedText, {
                          doc,
                          hideFormatting: true,
                          collapse: true,
                          searchTerm: vnode.state.searchTerm,
                        });
                      }
                    })(),
                  ])
                ] : [
                  m('.search-results-thread-title', [
                    'Comment on ',
                    decodeURIComponent(result.title),
                  ]),
                  m('.search-results-thread-subtitle', [
                    m('span.created-at', moment(result.created_at).fromNow()),
                    m(User, { user: new AddressInfo(result.address_id, result.address, result.address_chain, null) }),
                  ]),
                  m('.search-results-comment', [
                    (() => {
                      try {
                        const doc = JSON.parse(decodeURIComponent(result.body));
                        if (!doc.ops) throw new Error();
                        return m(QuillFormattedText, {
                          doc,
                          hideFormatting: true,
                          collapse: true,
                          searchTerm: vnode.state.searchTerm,
                        });
                      } catch (e) {
                        const doc = decodeURIComponent(result.body);
                        return m(MarkdownFormattedText, {
                          doc,
                          hideFormatting: true,
                          collapse: true,
                          searchTerm: vnode.state.searchTerm,
                        });
                      }
                    })(),
                  ]),
                ]
              ]);
            })
          ]),
        ]),
      ])
    ]);
  }
};

export default SearchBar;
