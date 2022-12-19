/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'pages/search/search_bar.scss';

import app from 'state';
import { SearchQuery } from 'models';
import { executeSearch, search } from './helpers';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWText } from '../../components/component_kit/cw_text';
import { getClasses } from '../../components/component_kit/helpers';

type SearchChipAttrs = {
  isActive: boolean;
  label: string;
  onclick: () => void;
};

export class SearchChip extends ClassComponent<SearchChipAttrs> {
  view(vnode: m.Vnode<SearchChipAttrs>) {
    const { isActive, label, onclick } = vnode.attrs;

    return (
      <CWText
        type="b2"
        fontWeight="medium"
        className={getClasses<{ isActive: boolean }>(
          {
            isActive,
          },
          'SearchChip'
        )}
        onclick={onclick}
      >
        {label}
      </CWText>
    );
  }
}

export class SearchBar extends ClassComponent {
  private results: Array<any>;
  private searchQuery: SearchQuery;
  private searchTerm: Lowercase<string>;

  oninit() {
    this.searchTerm = '';
  }

  view() {
    const historyList = app.search.getHistory().map((h) => (
      <div
        onclick={() => {
          executeSearch(h);
        }}
      >
        {h.searchTerm}
        <CWIconButton
          iconName="close"
          onclick={(e) => {
            e.stopPropagation();
            app.search.removeFromHistory(h);
          }}
        />
      </div>
    ));

    const searchBarSearch = () => {
      if (this.searchTerm === '') {
        return;
      } else {
        this.searchQuery = m.route.get().startsWith('/search')
          ? SearchQuery.fromUrlParams(m.route.param())
          : new SearchQuery(this.searchTerm, {
              isSearchPreview: true,
              chainScope: app.activeChainId(),
            });
      }

      search(this.searchQuery, this);
    };

    return (
      <div class="SearchBar">
        <div class="search-and-icon-container">
          <input
            placeholder="Search Common"
            value={this.searchTerm}
            autocomplete="off"
            oninput={(e) => {
              this.searchTerm = e.target.value?.toLowerCase();
            }}
            onkeyup={(e) => {
              if (e.key === 'Enter') {
                searchBarSearch();
              }
            }}
          />
          <div class="searchbar-icon">
            <CWIconButton iconName="search" onclick={searchBarSearch} />
          </div>
          {this.results && (
            <div class="search-results-dropdown">
              {this.results}
              {historyList.length > 0 && (
                <>
                  <CWText type="caption">Search History</CWText>
                  {historyList}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
}
