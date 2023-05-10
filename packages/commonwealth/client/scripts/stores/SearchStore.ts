import { Store } from '.';
import type SearchQuery from '../models/SearchQuery';
import SearchResult from '../models/SearchResult';

class SearchStore extends Store<SearchResult> {
  private _storeSearch: { [encodedQueryString: string]: SearchResult } = {};

  public add(search: SearchResult) {
    if (!this._storeSearch[search.query.toEncodedString()]) {
      super.add(search);
      this._storeSearch[search.query.toEncodedString()] = search;
    }
    return this;
  }

  public getOrAdd(query: SearchQuery) {
    if (!this._storeSearch[query.toEncodedString()]) {
      this.add(new SearchResult(query));
    }
    return this.getByQueryString(query.toEncodedString());
  }

  public remove(search: SearchResult) {
    super.remove(search);
    if (!this._storeSearch[search.query.toEncodedString()]) {
      throw new Error('Search is not in store');
    } else {
      delete this._storeSearch[search.query.toEncodedString()];
    }
    return this;
  }

  public clear() {
    super.clear();
    this._storeSearch = {};
  }

  public getByQueryString(queryString: string): SearchResult {
    return this._storeSearch[queryString] || null;
  }
}

export default SearchStore;
