/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
import moment from 'moment';

import 'pages/search/search_bar.scss';

import app from 'state';
import { notifyError } from 'controllers/app/notifications';
import { AddressInfo, SearchQuery } from 'models';
import { SearchScope } from 'models/SearchQuery';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWText } from '../../components/component_kit/cw_text';
import { CommunityLabel } from '../../components/community_label';
import { renderQuillTextBody } from '../../components/quill/helpers';
import User from '../../components/widgets/user';
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

const getResultsPreview = (searchQuery: SearchQuery) => {
  const types = searchQuery.getSearchScope();

  const results = Object.fromEntries(
    Object.entries(app.search.getByQuery(searchQuery).results).map(([k, v]) => [
      k,
      v.slice(0, 2),
    ])
  );

  const organizedResults = [];

  types.forEach((type: SearchScope) => {
    const result = results[type];

    result.forEach((item) => {
      const resultRow =
        item.searchType === SearchScope.Threads ? (
          <div
            onclick={() =>
              m.route.set(`/${item.chain}/discussion/${item.proposalid}`)
            }
          >
            {decodeURIComponent(item.title)}
            <CWText>{moment(item.created_at).fromNow()}</CWText>
            {m(User, {
              user: new AddressInfo(
                item.address_id,
                item.address,
                item.address_chain,
                null
              ),
            })}
            {renderQuillTextBody(item.body, {
              hideFormatting: true,
              collapse: true,
              searchTerm: searchQuery.searchTerm,
            })}
          </div>
        ) : item.searchType === SearchScope.Members ? (
          m(User, {
            user: app.profiles.getProfile(item.chain, item.address),
            linkify: true,
          })
        ) : item.searchType === SearchScope.Communities ? (
          <div
            onclick={() => {
              m.route.set(
                item.address
                  ? `/${item.address}`
                  : item.id
                  ? `/${item.id}`
                  : '/'
              );
            }}
          >
            <CommunityLabel community={item} />
          </div>
        ) : item.searchType === SearchScope.Replies ? (
          <div
            onclick={() => {
              m.route.set(
                `/${item.chain}/proposal/${item.proposalid.split('_')[0]}/${
                  item.proposalid.split('_')[1]
                }`
              );
            }}
          >
            <CWText>{`Comment on ${decodeURIComponent(item.title)}`}</CWText>
            <CWText>{moment(item.created_at).fromNow()}</CWText>
            {m(User, {
              user: new AddressInfo(
                item.address_id,
                item.address,
                item.address_chain,
                null
              ),
            })}
            {renderQuillTextBody(item.text, {
              hideFormatting: true,
              collapse: true,
              searchTerm: searchQuery.searchTerm,
            })}
          </div>
        ) : null;

      organizedResults.push(resultRow);
    });
  });

  return organizedResults;
};

const getSearchPreview = async (searchQuery: SearchQuery, state) => {
  try {
    await app.search.search(searchQuery);
  } catch (err) {
    state.results = {};
    notifyError(err.responseJSON?.error || err.responseText || err.toString());
  }

  state.results = getResultsPreview(searchQuery);

  app.search.addToHistory(searchQuery);

  m.redraw();
};

// export const executeSearch = (query: SearchQuery) => {
//   if (!query.searchTerm || !query.searchTerm.toString().trim()) {
//     notifyError('Enter a valid search term');
//     return;
//   }

//   if (query.searchTerm.length < 4) {
//     notifyError('Query must be at least 4 characters');
//   }

//   query.isSearchPreview = false;

//   app.search.addToHistory(query);

//   m.route.set(`/search?${query.toUrlParams()}`);
// };

export class SearchBar extends ClassComponent {
  private results: Array<any>;
  private searchQuery: SearchQuery;
  private searchTerm: Lowercase<string>;

  oninit() {
    this.searchTerm = '';
  }

  view() {
    const historyList = app.search.getHistory().map((previousQuery) => (
      <div
        class="history-row"
        onclick={() => {
          getSearchPreview(previousQuery, this);
        }}
      >
        {previousQuery.searchTerm}
        <CWIconButton
          iconName="close"
          onclick={(e) => {
            e.stopPropagation();
            app.search.removeFromHistory(previousQuery);
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

      getSearchPreview(this.searchQuery, this);
    };

    return (
      <div class="SearchBar">
        <div class="search-and-icon-container">
          <input
            placeholder="Search Common"
            defaultValue={m.route.param('q') || this.searchTerm}
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
              {this.results.length > 0 ? (
                this.results
              ) : (
                <CWText type="caption">No Results</CWText>
              )}
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
