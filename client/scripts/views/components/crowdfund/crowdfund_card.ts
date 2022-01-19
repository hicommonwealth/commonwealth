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
}

const CrowdfundCard: m.Component<
  CrowdfundCardAttrs,
  CrowdfundCardState
> = {
  view: (vnode) => {
    return m('.CrowdfundCard', {

    }, [
      m('.cf-header-panel', [
        m('.cf-header-img')
      ]),
      m('.cf-info-panel', [
        m('.cf-info-header', [
          m('.cf-title', DummyCrowdfundData.CrowdfundTitle),
          m('.cf-block-count', `${DummyCrowdfundData.CrowdfundBlockCount} blocks`)
        ]),
        m('.cf-info-body', DummyCrowdfundData.CrowdfundDescription),
        m('.cf-info-footer', [
          m(AnonymousUser)
        ])
      ])
    ]);
  }
}

export default CrowdfundCard;