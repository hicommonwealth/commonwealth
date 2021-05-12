import $ from 'jquery';

const CACHE_EXPIRY_TIME = 3600000; // One hour
const TOKEN_LISTS_KEY = 'tokenLists';
const TOKEN_LISTS_LAST_UPDATED_KEY = 'tokenListsLastUpdated';

export default class TokensController {
  private tokens = [];
  private loaded = false;

  private async fetchTokens() {
    return $.getJSON('/api/getTokensFromLists')
      .then((response) => {
        if (response.status === 'Failure') {
          throw response.message;
        } else {
          return response.result;
        }
      });
  }

  public async initTokens() {
    const tokenListsString = localStorage.getItem(TOKEN_LISTS_KEY);
    const tokenListsLastUpdated = localStorage.getItem(TOKEN_LISTS_LAST_UPDATED_KEY);

    if (tokenListsString && tokenListsLastUpdated
      && Date.now() - parseInt(tokenListsLastUpdated, 10) < CACHE_EXPIRY_TIME) {
      try {
        const tokenLists = JSON.parse(tokenListsString);
        this.loaded = true;
        this.tokens = tokenLists;
        return this.tokens;
      } catch (e) {
        console.log('Error occurred parsing tokenLists in localStorage', e);
        localStorage.removeItem(TOKEN_LISTS_KEY);
      }
    }
    const newTokenLists = await this.fetchTokens();
    localStorage.setItem(TOKEN_LISTS_KEY, JSON.stringify(newTokenLists));
    localStorage.setItem(TOKEN_LISTS_LAST_UPDATED_KEY, Date.now().toString());
    this.loaded = true;
    this.tokens = newTokenLists;

    return this.tokens;
  }

  public getAll() {
    return this.tokens;
  }

  public hasLoaded() {
    return this.loaded;
  }
}
