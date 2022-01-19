import 'components/crowdfund/crowdfund_card.scss';

import m from 'mithril';
import { AnonymousUser } from '../widgets/user';

interface CrowdfundCardAttrs {
  crowdfund;
}

interface CrowdfundCardState {
}

enum DummyCrowdfundData {
  CrowdfundTitle = 'Project Name',
  CrowdfundDescription = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '
    + 'Sit ullamcorper tortor pretium amet eget leo. Venenatis id risus at mollis '
    + 'orci sapien integer id non eget.',
  CrowdfundBlockCount = '16K',
  CrowdfundCompletionPercentage = .32
}

const DummyChainIcon: m.Component<{ chain, onclick, size: number }> = {
  view: (vnode) => {
    const iconUrl = 'https://commonwealth.im/static/img/protocols/edg.png'
    const size = vnode.attrs.size;
    return m('.ChainIcon', { class: onclick ? 'onclick' : '' }, [
      m('img.chain-icon', {
        style: `width: ${size}px; height: ${size}px;`,
        src: iconUrl,
        onclick
      })
    ]);
  }
};

const CrowdfundCard: m.Component<
  CrowdfundCardAttrs,
  CrowdfundCardState
> = {
  view: (vnode) => {
    return m('.CrowdfundCard', {

    }, [
      m('.cf-header-panel', [
        m(DummyChainIcon, { chain: null, onclick: null, size: 45 })
      ]),
      m('.cf-completion-bar', [
        m('.completed-percentage', {
          style: `width: ${DummyCrowdfundData.CrowdfundCompletionPercentage * 400}px`
        }),
      ]),
      m('.cf-info-panel', [
        m('.cf-info-header', [
          m('h3.cf-title', DummyCrowdfundData.CrowdfundTitle),
          m('.cf-block-count', `${DummyCrowdfundData.CrowdfundBlockCount} Blocks`)
        ]),
        m('.cf-info-body', DummyCrowdfundData.CrowdfundDescription),
        m('.cf-info-footer', [
          m(AnonymousUser, {
              avatarSize: 20,
              distinguishingKey: '123',
          })
        ])
      ])
    ]);
  }
}

export default CrowdfundCard;