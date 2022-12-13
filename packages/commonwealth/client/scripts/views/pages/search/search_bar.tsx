/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
import $ from 'jquery';
import {
  ControlGroup,
  Icon,
  Icons,
  Input,
  List,
  ListItem,
  Button,
  Size,
} from 'construct-ui';

import 'pages/search/search_bar.scss';

import app from 'state';
import { SearchQuery } from 'models';
import { SearchScope } from 'models/SearchQuery';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import { getSearchHistoryPreview, executeSearch, search } from './helpers';

export class SearchBar extends ClassComponent {
  private activeChain: string;
  private closeResults: () => void;
  private errorText: string;
  private filterMenuActive: boolean;
  private focused: boolean;
  private hideResults: boolean;
  private inputTimeout: any;
  private isTyping: boolean;
  private results: any[];
  private searchQuery: SearchQuery;
  private searchTerm: string;
  private setUsingFilterMenu: (boolean) => void;

  view() {
    if (!this.searchTerm) {
      this.searchTerm = '';
    }

    if (!this.searchQuery) {
      this.searchQuery = m.route.get().startsWith('/search')
        ? SearchQuery.fromUrlParams(m.route.param())
        : new SearchQuery('', {
            isSearchPreview: true,
            chainScope: app.activeChainId(),
          });

      this.activeChain = app.activeChainId()
        ? app.activeChainId()
        : this.searchQuery.chainScope;
      this.isTyping = false;
    }

    if (
      this.searchQuery.searchTerm !== this.searchTerm &&
      this.searchTerm.length > 3
    ) {
      this.searchQuery.searchTerm = this.searchTerm;
    }

    const { results, searchQuery } = this;

    const setFilterMenuActive = (using: boolean) => {
      this.filterMenuActive = using;
    };

    this.closeResults = () => {
      this.hideResults = true;
    };

    this.setUsingFilterMenu = (using) => {
      this.filterMenuActive = using;
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
          // eslint-disable-next-line max-len
          label:
            "Tip: You can use operators like 'single quotes', and the keyword &quot;or&quot; to limit your search!",
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
        class: disabled ? 'disabled' : '',
        active: this.searchQuery.searchScope.includes(scope),
        onclick: () => {
          this.searchQuery.toggleScope(scope);
          search(this.searchQuery, this);
        },
        onmouseover: () => {
          this.filterMenuActive = true;
        },
        onmouseout: () => {
          this.filterMenuActive = false;
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
        ).map((s) => scopeToButton(s, false))
      );

    const filterDropdown = m(List, { class: 'search-results-list' }, [
      m(ListItem, { class: 'disabled', label: "I'm looking for: " }),
      m(ListItem, {
        class: 'disabled search-filter-button-bar',
        label: scopeButtons,
      }),
      this.activeChain &&
        !app.isCustomDomain() && [
          scopeTitle,
          m(ListItem, {
            class: 'disabled',
            label: m(Button, {
              size: Size.SM,
              onclick: () => {
                this.searchQuery.chainScope =
                  this.searchQuery.chainScope === this.activeChain
                    ? undefined
                    : this.activeChain;
                search(this.searchQuery, this);
              },
              active: this.searchQuery.chainScope === this.activeChain,
              onmouseover: () => {
                this.filterMenuActive = true;
              },
              onmouseout: () => {
                this.filterMenuActive = false;
              },
              label: `Inside chain: ${this.activeChain}`,
            }),
          }),
        ],
      this.searchTerm.length < 1
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
          : this.isTyping
          ? m(ListItem, {
              class: 'disabled upper-border',
              label: <CWSpinner size="small" />,
            })
          : m(ListItem, {
              class: 'search-history-no-results upper-border',
              label: 'Make your query longer than 3 characters to search',
            })
        : this.isTyping
        ? m(ListItem, {
            class: 'disabled upper-border',
            label: <CWSpinner size="small" />,
          })
        : results,
    ]);

    const cancelInputIcon = this.searchTerm
      ? m(Icon, {
          name: Icons.X,
          onclick: () => {
            const input = $('.SearchBar').find('input[name=search');
            input.val('');
            this.searchTerm = '';
          },
        })
      : null;

    const searchIcon = this.searchTerm
      ? m(Icon, {
          name: Icons.CORNER_DOWN_LEFT,
          onclick: () => {
            executeSearch(this.searchQuery);
          },
        })
      : null;

    return m(ControlGroup, { class: 'SearchBar' }, [
      m(Input, {
        name: 'search',
        placeholder: 'Type to search...',
        autofocus: false, // !isMobile,
        fluid: true,
        tabIndex: -10,
        contentRight:
          this.searchTerm && m(ControlGroup, [cancelInputIcon, searchIcon]),
        defaultValue: m.route.param('q') || this.searchTerm,
        value: this.searchTerm,
        autocomplete: 'off',
        onclick: async () => {
          this.focused = true;
        },
        onfocusout: () => {
          if (!this.filterMenuActive) this.focused = false;
        },
        oninput: (e) => {
          e.stopPropagation();
          this.isTyping = true;
          this.focused = true;
          this.searchTerm = e.target.value?.toLowerCase();
          clearTimeout(this.inputTimeout);
          const timeout = e.target.value?.length > 3 ? 250 : 1000;
          this.inputTimeout = setTimeout(() => {
            this.isTyping = false;
            if (e.target.value?.length > 3) {
              search(this.searchQuery, this);
            } else {
              this.searchQuery.searchTerm = e.target.value?.toLowerCase();
              this.results = [];
              m.redraw();
            }
          }, timeout);
        },
        onkeyup: (e) => {
          e.stopPropagation();
          if (e.key === 'Enter') {
            executeSearch(this.searchQuery);
          }
        },
      }),
      this.focused && !this.hideResults && filterDropdown,
    ]);
  }
}
