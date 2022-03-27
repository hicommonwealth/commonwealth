/* @jsx m */
import m from 'mithril';
import Sublayout from '../../sublayout';
import DelegateCard from './delegate_card';
import app from 'state';
import { Account, AddressInfo, Profile } from 'client/scripts/models';

type DelegationPageAttrs = { topic?: string };

class DelegationPage implements m.ClassComponent<DelegationPageAttrs> {
  private delegate: Account<any> | AddressInfo | Profile;
  view(vnode) {
    if (!this.delegate) {
      this.delegate = app.user.activeAccount; // TODO: Replace this with an actual fetch of the delegate
      m.redraw();
    }
    return (
      <Sublayout class="DelegationPage" title="Delegation">
        <div style="height: 50px"></div>
        <DelegateCard delegate={this.delegate} />
      </Sublayout>
    );
  }
}

export default DelegationPage;
