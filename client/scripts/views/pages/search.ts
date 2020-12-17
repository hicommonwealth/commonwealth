import 'pages/search.scss';

import $ from 'jquery';
import m from 'mithril';
import _ from 'lodash';
import moment from 'moment-twitter';
import { Input, Spinner, Tag } from 'construct-ui';

import { link, pluralize } from 'helpers';
import app from 'state';
import { AddressInfo } from 'models';

import { modelFromServer as threadModelFromServer } from 'controllers/server/threads';
import { modelFromServer as commentModelFromServer } from 'controllers/server/comments';
import QuillFormattedText from 'views/components/quill_formatted_text';
import MarkdownFormattedText from 'views/components/markdown_formatted_text';
import User from 'views/components/widgets/user';
import Sublayout from 'views/sublayout';

const SEARCH_PAGE_SIZE = 20;
const SEARCH_DELAY = 750;

const searchCache = {}; // only used to restore search results when returning to the page

const search = _.debounce((searchTerm, vnode) => {
  vnode.state.searchTerm = searchTerm;

  const chainId = app.activeChainId();
  const communityId = app.activeCommunityId();
  const params = {
    chain: chainId,
    community: communityId,
    cutoff_date: null, // cutoffDate.toISOString(),
    search: searchTerm,
    page_size: SEARCH_PAGE_SIZE,
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

const SearchPage : m.Component<{}, { results, searchLoading, searchTerm, errorText: string }> = {
  view: (vnode) => {
    return m(Sublayout, {
      class: 'SearchPage',
      title: [
        'Search ',
        m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
      ],
      showNewProposalButton: true,
    }, [
      m(Input, {
        placeholder: 'Type to search...',
        autofocus: true,
        fluid: true,
        class: 'search-page-input',
        defaultValue: m.route.param('q'),
        oncreate: (vvnode) => {
          const $input = $(vvnode.dom).find('input').focus();
          // wait for defaultValue to be applied, then try to load the search request for ?q=
          setTimeout(() => {
            if ($input.val() !== '' && $input.val().toString().length >= 3) {
              const searchTerm = $input.val().toString();
              if (searchCache[searchTerm]) {
                vnode.state.results = searchCache[searchTerm];
                vnode.state.searchLoading = false;
                m.redraw();
              } else {
                search(searchTerm, vnode);
              }
            }
          }, 0);
        },
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
          m.route.set(`/${app.activeId()}/search?q=${encodeURIComponent(searchTerm.toString().trim())}`);
        }
      }),
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
          pluralize(vnode.state.results.length, 'result'),
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
                      return m(QuillFormattedText, { doc, hideFormatting: true, collapse: true });
                    } catch (e) {
                      const doc = decodeURIComponent(result.body);
                      return m(MarkdownFormattedText, { doc, hideFormatting: true, collapse: true });
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
                      return m(QuillFormattedText, { doc, hideFormatting: true, collapse: true });
                    } catch (e) {
                      const doc = decodeURIComponent(result.body);
                      return m(MarkdownFormattedText, { doc, hideFormatting: true, collapse: true });
                    }
                  })(),
                ]),
              ]
            ]);
          })
        ]),
      ]),
    ]);
  }
};

export default SearchPage;
