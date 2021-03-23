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
import { search, SearchPrefixes } from '../components/search_bar';

const SEARCH_DELAY = 750;
const SEARCH_PAGE_SIZE = 50; // must be same as SQL limit specified in the database query

const searchCache = {}; // only used to restore search results when returning to the page

const SearchPage : m.Component<{
  results: any[]
}, {
  results: any[],
  searchLoading: boolean,
  searchTerm: string,
  searchPrefix: string,
  overridePrefix: boolean,
  errorText: string
}> = {
  view: (vnode) => {
    if (!app.chain && !app.community) {
      return m(PageLoading, {
        narrow: true,
        showNewProposalButton: true,
        title: [
          'Search Discussions ',
          m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
        ],
      });
    }

    const searchTerm = m.route.param('q');

    if (app.searchCache[searchTerm]?.length) {
      vnode.state.results = app.searchCache[searchTerm];
    }


    return m(Sublayout, {
      class: 'SearchPage',
      title: [
        'Search Discussions ',
        m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
      ],
      showNewProposalButton: true,
    }, [
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
          vnode.state.results.length === SEARCH_PAGE_SIZE
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
    ]);
  }
};

export default SearchPage;
