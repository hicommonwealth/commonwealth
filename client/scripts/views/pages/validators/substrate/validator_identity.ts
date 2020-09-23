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
import { IValidators } from 'controllers/chain/substrate/account';

const truncLength = {
  length: 20
};

export interface IValidatorState {
  dynamic: {
    info: any // TODOO: UNCOMMENT THIS AND REMOVE THE DUMMY DATA BELOW IAccountInfo;
    validators: IValidators;
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

const Identity = makeDynamicComponent<IdentityAttrs, IValidatorState>({
  getObservables: (attrs) => ({
    // we need a group key to satisfy the dynamic object constraints, so here we use the chain class
    groupKey: attrs.stash,
    info: (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.info(attrs.stash)
      : null,
    validators: ((app.chain.base === ChainBase.Substrate) ? (app.chain as Substrate).staking.validators : null)
  }),
  view: (vnode) => {
    let validators: IValidators = (vnode.state.dynamic && vnode.state.dynamic.validators) ? vnode.state.dynamic.validators : {};
    const info = (vnode.state.dynamic && vnode.state.dynamic.info) ? vnode.state.dynamic.info : {}
    const onlyIcon = vnode.attrs.onlyIcon;
    
    //const { info } = vnode.state.dynamic;
    // if (info)
    //   return m('span', [
    //     m(User, { user: app.chain.accounts.get(vnode.attrs.stash), linkify: true }),
    //     m('hr'),
    //     m('p', 'Loading ...'),
    //   ]);


    // HARD CODED
    info.email = "hello@example.com"
    info.web = "http://hello.world"
    info.twitter = "@adsadad"
    info.riot = "somedata"
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
        m('div.validator-profile-imonline-icons', validators && m(ImOnline, {
          toBeElected: true,//(validators[vnode.attrs.stash] ? validators[vnode.attrs.stash].toBeElected : false),
          isOnline: true,//(validators[vnode.attrs.stash] ? validators[vnode.attrs.stash].isOnline : false),
          hasMessage: true,// (validators[vnode.attrs.stash] ? validators[vnode.attrs.stash].hasMessage : false),
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
