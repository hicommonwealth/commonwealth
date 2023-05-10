import $ from 'jquery';
import app from 'state';

import { redraw } from 'mithrilInterop';
import StarredCommunity from '../../models/StarredCommunity';

class CommunitiesController {
  public isStarred(chain: string) {
    if (!chain) throw new Error('Must provide a chain community');
    if (!app.isLoggedIn()) return false;

    return (
      app.user.starredCommunities.findIndex((c) => {
        return c.chain === chain;
      }) !== -1
    );
  }

  public async setStarred(chain: string) {
    if (!chain) throw new Error('Must provide a chain community');
    if (!app.isLoggedIn()) throw new Error('Must be logged in');
    const isAlreadyStarred = this.isStarred(chain);

    return new Promise<void>((resolve, reject) => {
      const params = {
        chain,
        isAlreadyStarred,
        auth: true,
        jwt: app.user.jwt,
      };

      $.post(`${app.serverUrl()}/starCommunity`, params)
        .then((response) => {
          if (!isAlreadyStarred) {
            const json = response.result;
            app.user.addStarredCommunity(
              new StarredCommunity(json.chain, json.user_id)
            );
          } else {
            const star = app.user.starredCommunities.find((c) => {
              return c.chain === chain;
            });
            app.user.removeStarredCommunity(star);
          }
          resolve();
          redraw();
        })
        .catch(() => {
          reject();
        });
    });
  }
}

export default CommunitiesController;
