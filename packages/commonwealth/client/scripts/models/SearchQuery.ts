export enum SearchScope {
  'Members' = 'Members',
  'Communities' = 'Communities',
  'Proposals' = 'Proposals',
  'Threads' = 'Threads',
  'Replies' = 'Replies',
  'All' = 'All',
}

export enum SearchSort {
  'Best' = 'Best',
  'Newest' = 'Newest',
  'Oldest' = 'Oldest',
}

export interface SearchParams {
  communityScope?: string;
  chainScope?: string;
  isSearchPreview?: boolean;
  searchScope?: Array<SearchScope>;
  sort?: SearchSort;
  resultSize?: number;
}

export default class SearchQuery implements SearchParams {
  public searchTerm: Lowercase<string>;
  public chainScope?: string;
  public isSearchPreview?: boolean;
  public searchScope: Array<SearchScope>;
  public sort: SearchSort;

  constructor(searchTerm = '', params?: SearchParams) {
    this.searchTerm = <Lowercase<string>>searchTerm.toLowerCase();
    this.searchScope = params?.searchScope || [SearchScope.All];
    this.chainScope = params?.chainScope;
    this.isSearchPreview = !!params?.isSearchPreview;
    this.sort = params?.sort || SearchSort.Best;
  }

  public toEncodedString() {
    let encodedString =
      this.searchTerm.trim().replace(/\s+/g, '%20') +
      (this.chainScope ? ` chainScope=${this.chainScope}` : '') +
      (this.isSearchPreview ? ` isSearchPreview=${this.isSearchPreview}` : '') +
      (this.sort ? ` sort=${this.sort}` : '');

    for (const scope in this.searchScope) {
      if (
        Object.prototype.hasOwnProperty.call(this.searchScope, scope) &&
        this.searchScope[scope] !== SearchScope.All
      ) {
        encodedString += ` scope[]=${this.searchScope[scope]}`;
      }
    }
    return encodedString;
  }

  public static fromEncodedString(encodedString: string) {
    const props = encodedString.split(' ');
    const sq = new SearchQuery(props[0].replace(/(%20)/g, ' '));
    for (let i = 1; i < props.length; i++) {
      const [prop, value] = props[i].split('=');
      if (prop === 'scope[]') {
        value === 'ALL' ? '' : sq.toggleScope(SearchScope[value]);
      } else if (prop === 'sort') {
        sq.sort = SearchSort[value];
      } else {
        sq[prop] =
          value === 'true' || value === 'false' ? value === 'true' : value;
      }
    }
    return sq;
  }

  public toggleScope(scope: SearchScope) {
    const index = this.searchScope.indexOf(scope);
    if (index > -1) {
      this.searchScope.splice(index, 1);
    } else {
      if (
        this.searchScope.length === 1 &&
        this.searchScope[0] === SearchScope.All
      ) {
        this.searchScope = [scope];
      } else {
        this.searchScope.push(scope);
      }
    }

    if (this.searchScope.length === 0) {
      this.searchScope.push(SearchScope.All);
    }
  }

  public toUrlParams() {
    return `q=${this.toEncodedString().trim().replace(/\s+/g, '&')}`;
  }

  public static fromUrlParams(url: Record<string, any>) {
    const sq = new SearchQuery(url['q']);
    sq.chainScope = url['chainScope'] || undefined;
    sq.isSearchPreview = url['preview'] === 'true';
    sq.sort = url['sort'] || SearchSort.Best;
    sq.searchScope = url['scope'] || [SearchScope.All];
    return sq;
  }

  public getSearchScope() {
    return this.searchScope[0] === SearchScope.All
      ? this.chainScope
        ? [SearchScope.Threads, SearchScope.Replies]
        : [
            SearchScope.Threads,
            SearchScope.Replies,
            SearchScope.Communities,
            SearchScope.Members,
          ]
      : this.searchScope;
  }
}
