/* eslint-disable no-bitwise */

import type { IUniqueId } from './interfaces';
import type SearchQuery from './SearchQuery';

export default class SearchResult implements IUniqueId {
  public readonly query: SearchQuery;
  public loaded: boolean;
  public results: Record<string, Array<any>>;
  public readonly identifier: string;
  public readonly uniqueIdentifier: string;
  public readonly slug: string;
  public readonly id: number;

  constructor(searchQuery: SearchQuery) {
    this.query = searchQuery;
    this.results = {};
    this.loaded = false;
    const queryString = searchQuery.toEncodedString();
    this.identifier = queryString;
    this.uniqueIdentifier = queryString;
    this.slug = queryString;

    // Hash term into number id which seems to be required for IUniqueId interface
    this.id = queryString.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
  }
}
