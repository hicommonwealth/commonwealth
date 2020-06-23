import m from 'mithril';
import app from 'state';
import User from 'views/components/widgets/user';
import { Icons, Icon } from 'construct-ui';
import { IAccountInfo } from 'controllers/chain/substrate/staking';

const Identity: m.Component<IAccountInfo, {}> = {
  view: (vnode) => {
    const clsName = vnode.attrs.isGood ? '.icon-ok-circled.green' : vnode.attrs.isBad ? '.icon-cancel-circle.red' : '.icon-minus-circled.gray';
    const clsText = vnode.attrs?.judgements.length
      ? (vnode.attrs.isGood
        ? (vnode.attrs.isKnownGood ? 'Known good' : 'Reasonable')
        : (vnode.attrs.isErroneous ? 'Erroneous' : 'Low quality')
      )
      : 'No judgments';
    return m('div.identity',
      m('span', [
        m(User, { user: app.chain.accounts.get(vnode.attrs.stash), linkify: true }),
        m('hr'),
        m('p', vnode.attrs.legal),
        vnode.attrs.email
          && m('p', [
            m(Icon, { name: Icons.AT_SIGN, size: 'sm' }),
            m('label', `  ${vnode.attrs.email}`)
          ]),
        vnode.attrs.web
          && m('p', [
            m(Icon, { name: Icons.GLOBE, size: 'sm' }),
            m('label', `  ${vnode.attrs.web}`)
          ]),
        vnode.attrs.twitter
          && m('p', [
            m(Icon, { name: Icons.TWITTER, size: 'sm' }),
            m('label', `  ${vnode.attrs.twitter}`)
          ]),
        vnode.attrs.riot
          && m('p', [
            m(Icon, { name: Icons.FIGMA, size: 'sm' }),
            m('label', `  ${vnode.attrs.riot}`)
          ]),
        m('p.User', [
          m(`span.identity-icon${clsName}`, ''),
          m('label', `  ${clsText}`)
        ])
      ]));
  }
};

export default Identity;
