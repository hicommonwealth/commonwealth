import m from 'mithril';
import { IAccountInfo } from 'controllers/chain/substrate/staking';

const Identity: m.Component<IAccountInfo, {}> = {
  view: (vnode) => {

    const clsName = vnode.attrs.isGood ? 'green' : vnode.attrs.isBad ? 'red' : 'yellow';
    const clsText = vnode.attrs?.judgements.length
      ? (vnode.attrs.isGood
        ? (vnode.attrs.isKnownGood ? 'Known good' : 'Reasonable')
        : (vnode.attrs.isErroneous ? 'Erroneous' : 'Low quality')
      )
      : 'No judgments';
    return m('div.identity',
      m('span', [
        m('p', vnode.attrs.name),
        m('p', vnode.attrs.legal),
        vnode.attrs.email
          && m('p', `email: ${vnode.attrs.email}`),
        vnode.attrs.web
          && m('p', `website: ${vnode.attrs.web}`),
        vnode.attrs.twitter
          && m('p', `twitter: ${vnode.attrs.twitter}`),
        vnode.attrs.riot
          && m('p', `riot: ${vnode.attrs.riot}`),
        m(`p.${clsName}`, clsText)
      ]));
  }
};

export default Identity;
