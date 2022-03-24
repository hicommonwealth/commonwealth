/* @jsx m */
import m from 'mithril';
import { CWCard } from '../../components/component_kit/cw_card';
import 'pages/delegation/delegate_card.scss';

type DelegateCardAttrs = { topic?: string };

class DelegateCard implements m.ClassComponent<DelegateCardAttrs> {
  view(vnode) {
    return (
      <CWCard
        elevation="elevation-2"
        interactive={true}
        className="delegate-card"
      >
        <div class="card-body">
          <div class="top-section">
            <div class="top-left"></div>
            <div class="top-right"></div>
          </div>
          <div class="bottom-section"></div>
        </div>
      </CWCard>
    );
  }
}

export default DelegateCard;
