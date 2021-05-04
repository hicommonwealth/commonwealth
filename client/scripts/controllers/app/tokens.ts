import m from 'mithril';
import $ from 'jquery';
const DAY_IN_MILLISECONDS = 86400000;
const TOKEN_LISTS_LOCAL_STORAGE_KEY = "token-lists";
const TOKEN_LISTS_LAST_UPDATED_KEY = "token-lists-last-updated";
import app from 'state';
export default class TokensController {
   async getTokensFromLists() {
    return $.getJSON('/api/getTokensFromLists')
    .then(response=>{
      if(response.status === 'Failure') { 
        throw response.message;
      } else {
        return response.result;
      }
    })
  }
}