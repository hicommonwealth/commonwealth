import m from 'mithril';
import app from 'state';
import { Button, Classes, Icons, Icon } from 'construct-ui';
import User from 'views/components/widgets/user';
import { ChainBase } from 'models';
import { truncate } from 'lodash';
import { externalLink } from 'helpers';
import Substrate from 'controllers/chain/substrate/main';
import { makeDynamicComponent } from 'models/mithril';
import { IAccountInfo } from 'controllers/chain/substrate/staking';
import ImOnline from './im_online';

const truncLength = {
  length: 20
};

export interface IValidatorState {
  dynamic: {
    info: any // TODOO: UNCOMMENT THIS AND REMOVE THE DUMMY DATA BELOW IAccountInfo;
  },
  isNominating: boolean;
}

export interface IdentityAttrs {
  stash: string;
  onlyIcon?: boolean;
  toBeElected?: boolean;
  isOnline?: boolean;
  hasMessage?: boolean;
}
const info = {
  isGood:true,
  isBad:true,
  email:'nblogist@gmail.com',
  web:'linkedin.com/in/furqanAhmed18',
  twitter: '@furqan',
  riot: '@riot'
};
const Identity = makeDynamicComponent<IdentityAttrs, IValidatorState>({
  getObservables: (attrs) => ({
    // we need a group key to satisfy the dynamic object constraints, so here we use the chain class
    groupKey: attrs.stash,
    // info: (app.chain.base === ChainBase.Substrate) // TODOO: uncomment this
    //   ? (app.chain as Substrate).staking.info(attrs.stash)
    //   : null
  }),
  view: (vnode) => {
    const onlyIcon = vnode.attrs.onlyIcon;
    // const { info } = vnode.state.dynamic;
    // if (info)
    //   return m('span', [
    //     m(User, { user: app.chain.accounts.get(vnode.attrs.stash), linkify: true }),
    //     m('hr'),
    //     m('p', 'Loading ...'),
    //   ]);

    const clsName = info.isGood
      ? '.icon-ok-circled.green'
      : info.isBad
        ? '.icon-cancel-circle.red'
        : '.icon-minus-circled.gray';

    if (onlyIcon) return m(`span.identity-icon${clsName}`, '');

    return m('div.identity',
      m('div.row', [
        // m(`span.identity-icon${clsName}`, ''),
        // TODOO: plan is to get the commented values  from vnode.attrs that is being called from profile_header
        m('div.validator-profile-imonline-icons', m(ImOnline, {
          toBeElected: true, // vnode.attrs.toBeElected,
          isOnline: true, // vnode.attrs.isOnline,
          hasMessage: true, // vnode.attrs.hasMessage,
        })),
        info.email
          && m('div.validator-profile-identity-icons', [
            m(Icon, { name: Icons.AT_SIGN, size: 'sm' }),
            m('label.left-5',
              externalLink('a', `mailto:${info.email}`,
                truncate(info.email, truncLength)))
          ]),
        info.web
          && m('div.validator-profile-identity-icons', [
            m(Icon, { name: Icons.GLOBE, size: 'sm' }),
            m('label.left-5',
              externalLink('a', info.web,
                truncate(info.web, truncLength)))
          ]),
        info.twitter
          && m('div.validator-profile-identity-icons', [
            m(Icon, { name: Icons.TWITTER, size: 'sm' }),
            m('label.left-5',
              externalLink('a', `https://twitter.com/${info.twitter}`,
                truncate(info.twitter, truncLength)))
          ]),
        info.riot
          && m('div.validator-profile-identity-icons', [
            m(Icon, { name: Icons.FIGMA, size: 'sm' }),
            m('label.left-5',
              externalLink('a', `https://riot.im/app/#/user/${info.riot}`,
                truncate(info.riot, truncLength)))
          ]),
      ]));
  }
});

export default Identity;
