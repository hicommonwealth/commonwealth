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

const truncLength = {
  length: 20
};

export interface IValidatorState {
  dynamic: {
    info: IAccountInfo;
  },
  isNominating: boolean;
}

export interface IdentityAttrs {
  stash: string;
}

const Identity = makeDynamicComponent<IdentityAttrs, IValidatorState>({
  getObservables: (attrs) => ({
    // we need a group key to satisfy the dynamic object constraints, so here we use the chain class
    groupKey: attrs.stash,
    info: (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.info(attrs.stash)
      : null
  }),
  view: (vnode) => {
    const { info } = vnode.state.dynamic;
    if (!info)
      return m('span', [
        m(User, { user: app.chain.accounts.get(vnode.attrs.stash), linkify: true }),
        m('hr'),
        m('p', 'Loading ...'),
      ]);

    const clsName = info.isGood
      ? '.icon-ok-circled.green'
      : info.isBad
        ? '.icon-cancel-circle.red'
        : '.icon-minus-circled.gray';

    const clsText = info?.judgements.length
      ? (info.isGood
        ? (info.isKnownGood ? 'Known good' : 'Reasonable')
        : (info.isErroneous ? 'Erroneous' : 'Low quality'))
      : 'No judgments';

    return m('div.identity',
      m('div', [
        m(User, { user: app.chain.accounts.get(vnode.attrs.stash), linkify: true }),
        m('p.legal', info.legal),
        m('hr'),
        info.email
          && m('p', [
            m(Icon, { name: Icons.AT_SIGN, size: 'sm' }),
            m('label.left-5',
              externalLink('a', `mailto:${info.email}`,
                truncate(info.email, truncLength)))
          ]),
        info.web
          && m('p', [
            m(Icon, { name: Icons.GLOBE, size: 'sm' }),
            m('label.left-5',
              externalLink('a', info.web,
                truncate(info.web, truncLength)))
          ]),
        info.twitter
          && m('p', [
            m(Icon, { name: Icons.TWITTER, size: 'sm' }),
            m('label.left-5',
              externalLink('a', `https://twitter.com/${info.twitter}`,
                truncate(info.twitter, truncLength)))
          ]),
        info.riot
          && m('p', [
            m(Icon, { name: Icons.FIGMA, size: 'sm' }),
            m('label.left-5',
              externalLink('a', `https://riot.im/app/#/user/${info.riot}`,
                truncate(info.riot, truncLength)))
          ]),
        (info.legal || info.email || info.web || info.twitter || info.riot)
        && (m('hr')),
        m('p.User', [
          m(`span.identity-icon${clsName}`, ''),
          m('label', `  ${clsText}`)
        ])
      ]),
      m(Button, {
        class: Classes.POPOVER_DISSMISS,
        label: 'Dismiss',
        size: 'xs'
      }));
  }
});

export default Identity;
