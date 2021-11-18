import { SearchResult } from '../models'
import { Store } from '.';

class SearchStore extends Store<SearchResult> {
  private _storeSearch: { [query: string]: SearchResult } = {};

  public add(search: SearchResult) {
    if (!this._storeSearch[search.query.queryString]) {
      super.add(search);
      this._storeSearch[search.query.queryString] = search;
    }
    return this;
  }

  public getOrAdd(term: string){
    if (!this._storeSearch[term]) {
      this.add(new SearchResult(term))
    }
    return this.getByTerm(term)
  }

  public remove(search: SearchResult) {
    super.remove(search);
    if (!this._storeSearch[search.query.queryString]) {
      throw new Error('Search is not in store');
    } else {
      delete this._storeSearch[search.query.queryString]
    }
    return this;
  }

  public clear() {
    super.clear();
    this._storeSearch = {};
  }

  public getByTerm(term: string) {
    return this._storeSearch[term] || null
  }
}

export default SearchStore;
