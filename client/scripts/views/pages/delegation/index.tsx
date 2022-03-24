/* @jsx m */
import m from 'mithril';
import Sublayout from '../../sublayout';
import DelegateCard from './delegate_card';

type DelegationPageAttrs = { topic?: string };

class DelegationPage implements m.ClassComponent<DelegationPageAttrs> {
  view(vnode) {
    return (
      <Sublayout class="DelegationPage" title="Delegation">
        <DelegateCard />
      </Sublayout>
    );
  }
}

export default DelegationPage;
