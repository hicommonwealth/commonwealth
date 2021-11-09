import { SearchResult } from '../models'
import { IdStore } from '.';

class SearchStore extends IdStore<SearchResult> {
  private _storeSearch: { [term: string]: SearchResult } = {};

  public add(search: SearchResult) {
    if (!this._storeSearch[search.term]) {
      super.add(search);
      this._storeSearch[search.term] = search;
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
    if (!this._storeSearch[search.term]) {
      throw new Error('Reaction not in proposals store');
    } else {
      delete this._storeSearch[search.term]
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
