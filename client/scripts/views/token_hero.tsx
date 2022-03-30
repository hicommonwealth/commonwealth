/* @jsx m */

import m from 'mithril';

import 'token_hero.scss';

import app from 'state';
import { ChainInfo, ITokenAdapter } from 'models';
import { isNotUndefined } from '../helpers/typeGuards';

type HeroAttrs = {
  chain: ChainInfo;
  hero?: m.Vnode;
};

export class TokenHero implements m.ClassComponent<HeroAttrs> {
  view(vnode) {
    const { chain, hero } = vnode.attrs;

    if (isNotUndefined(hero)) {
      return <div class="TokenHero">{hero}</div>;
    } else if (
      app.isLoggedIn() &&
      ITokenAdapter.instanceOf(app.chain) &&
      !app.user.activeAccount
    ) {
      return (
        <div class="TokenHero">
          Link an address that holds {chain.symbol} to participate in
          governance.
        </div>
      );
    } else {
      return null;
    }
  }
}
