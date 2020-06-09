import $ from 'jquery';
import app from 'state';
import m from 'mithril';
import { StarredCommunity } from 'models';

class CommunitiesController {
  public isStarred(chain: string, community: string) {
    if (!chain && !community) throw new Error('Must provide a community');
    if (chain && community) throw new Error('Invalid');
    if (!app.isLoggedIn()) return false;

    return app.login.starredCommunities.findIndex((c) => {
      return chain
        ? c.chain === chain
        : c.community === community;
    }) !== -1;
  }

  public async setStarred(chain: string, community: string, status: boolean) {
    if (!chain && !community) throw new Error('Must provide a community');
    if (chain && community) throw new Error('Invalid');
    if (!app.isLoggedIn()) throw new Error('Must be logged in');

    return new Promise((resolve, reject) => {
      const params = chain ? {
        chain,
        star: status,
        auth: true,
        jwt: app.login.jwt,
      } : {
        community,
        star: status,
        auth: true,
        jwt: app.login.jwt,
      };

      $.post(`${app.serverUrl()}/starCommunity`, params).then((response) => {
        if (status) {
          const json = response.result;
          app.login.starredCommunities.push(new StarredCommunity(json.chain, json.community, json.user_id));
        } else {
          const index = app.login.starredCommunities.findIndex((c) => {
            return chain
              ? c.chain === chain
              : c.community === community;
          });
          app.login.starredCommunities.splice(index, 1);
        }
        m.redraw();
        resolve();
      }).catch((err) => {
        reject();
      });
    });
  }
}

export default CommunitiesController;
