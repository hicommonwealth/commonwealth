import 'components/crowdfund/crowdfund_card.scss';

import m from 'mithril';
import { AnonymousUser } from '../../components/widgets/user';

export enum CrowdfundCardSize {
  Small = 'small',
  Medium = 'medium',
  Large = 'large'
}

interface CrowdfundCardAttrs {
  project; // : Project;
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

const CrowdfundHeaderPanel: m.Component<{ iconSize?: number }> = {
  view: (vnode) => {
    const { iconSize } = vnode.attrs;
    return m('.CrowdfundHeaderPanel', [
      iconSize && m(DummyChainIcon, {
        chain: null,
        onclick: null,
        size: iconSize
      })
    ]);
  }
}

const CrowdfundCompletionBar: m.Component<{ completionPercent: number }> = {
  view: (vnode) => {
    const { completionPercent } = vnode.attrs;
    return m('.CrowdfundCompletionBar', [
      m('.completed-percentage', {
        style: `width: ${completionPercent * 400}px`
      }),
    ]);
  }
}

const CrowdfundInfoPanel: m.Component<{ project, avatarSize: number, iconSize?: number }> = {
  view: (vnode) => {
    const { crowdfund, avatarSize, iconSize } = vnode.attrs;
    return m('.CrowdfundInfoPanel', [
      m('.cf-info-header', [
        m('h3.cf-title', [
          iconSize && m(DummyChainIcon, {
            chain: null,
            onclick: null,
            size: iconSize
          }),
          DummyCrowdfundData.CrowdfundTitle
        ]),
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
    const { project, size } = vnode.attrs;

    const CrowdfundCardLarge = m('.CrowdfundCard',
      { class: 'large' },
      [
        m(CrowdfundHeaderPanel, { iconSize: 45 }),
        m(CrowdfundCompletionBar, { completionPercent: (DummyCrowdfundData.CrowdfundCompletionPercent as number) }),
        m(CrowdfundInfoPanel, { project, avatarSize: 20 })
      ]
    );

    const CrowdfundCardMedium= m('.CrowdfundCard',
      { class: 'medium' },
      [
        m(CrowdfundHeaderPanel),
        m('.right-panel', [
          m(CrowdfundCompletionBar, { completionPercent: (DummyCrowdfundData.CrowdfundCompletionPercent as number) }),
          m(CrowdfundInfoPanel, { project, avatarSize: 16, iconSize: 24 })
        ])
      ]
    );

    const CrowdfundCardSmall = null;

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