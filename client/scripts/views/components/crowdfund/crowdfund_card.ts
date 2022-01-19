import 'components/crowdfund/crowdfund_card.scss';

import m from 'mithril';
import { AnonymousUser } from '../widgets/user';

enum CrowdfundCardSize {
  Small,
  Medium,
  Large
}
interface CrowdfundCardAttrs {
  crowdfund;
  size: CrowdfundCardSize;
}

interface CrowdfundCardState {
}

enum DummyCrowdfundData {
  CrowdfundTitle = 'Project Name',
  CrowdfundDescription = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '
    + 'Sit ullamcorper tortor pretium amet eget leo. Venenatis id risus at mollis '
    + 'orci sapien integer id non eget.',
  CrowdfundBlockCount = '16K',
  CrowdfundCompletionPercent = 0.32
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

const CrowdfundHeaderPanel: m.Component<{ iconSize }> = {
  view: (vnode) => {
    const { iconSize } = vnode.attrs;
    return m('.CrowdfundInfoPanel', [
      m(DummyChainIcon, {
        chain: null,
        onclick: null,
        size: iconSize
      })
    ]);
  }
}

const CrowdfundCompletionBar: m.Component<{ completionPercentage: number }> = {
  view: (vnode) => {
    const completionPercentage = vnode.attrs;
    return m('.CrowdfundCompletionBar', [
      m('.completed-percentage', {
        style: `width: ${completionPercentage * 400}px`
      }),
    ]);
  }
}
const CrowdfundInfoPanel: m.Component<{ crowdfund, avatarSize: number }> = {
  view: (vnode) => {
    const { crowdfund, avatarSize } = vnode.attrs;
    return m('.cf-info-panel', [
      m('.cf-info-header', [
        m('h3.cf-title', DummyCrowdfundData.CrowdfundTitle),
        m('.cf-block-count', `${DummyCrowdfundData.CrowdfundBlockCount} Blocks`)
      ]),
      m('.cf-info-body', DummyCrowdfundData.CrowdfundDescription),
      m('.cf-info-footer', [
        m(AnonymousUser, { // dummy user
            avatarSize,
            distinguishingKey: '123',
        })
      ])
    ]);
  }
}

const CrowdfundCard: m.Component<
  CrowdfundCardAttrs,
  CrowdfundCardState
> = {
  view: (vnode) => {
    const { crowdfund, size } = vnode.attrs;

    const CrowdfundCardLarge = m('.CrowdfundCard',
      { class: 'large' },
      [
        m(CrowdfundHeaderPanel, { iconSize: 20 }),
        m(CrowdfundCompletionBar, { completionPercentage: (DummyCrowdfundData.CrowdfundCompletionPercent as number) }),
        m(CrowdfundInfoPanel, { crowdfund, avatarSize: 45 })
      ]
    );

    const CrowdfundCardMedium;

    const CrowdfundCardSmall;

    switch (size) {
      case CrowdfundCardSize.Large:
        return CrowdfundCardLarge;
      case CrowdfundCardSize.Medium:
        return CrowdfundCardMedium;
      case CrowdfundCardSize.Small:
        return CrowdfundCardSmall;
      default:
    }
  }
}

export default CrowdfundCard;