// import 'components/digest_flag.scss';

import m from 'mithril';
import $ from 'jquery';
import app from 'state';
import { notifySuccess, notifyError } from 'controllers/app/notifications';

interface IAttrs {
  proposalId: number;
}
interface IState {
  clickedState: boolean;
}

const DigestFlagButton: m.Component<IAttrs, IState> = {
  oninit: (vnode: m.VnodeDOM<IAttrs, IState>) => {
    vnode.state.clickedState = false;
  },
  view: (vnode: m.VnodeDOM<IAttrs, IState>) => {
    const id = vnode.attrs.proposalId;
    return m('.span.DigestFlagButton.icon-star', {
      class: vnode.state.clickedState ? 'clicked-state' : '',
      onclick: (e) => {
        e.preventDefault();
        console.dir(id);
        vnode.state.clickedState = true;
        $.post(`${app.serverUrl()}/addDigestFlag`, {
          id,
          jwt: app.login.jwt,
        }).then((result) => {
          notifySuccess(`Successfully Flagged. Vote Count: ${result.result.votes}`);
          console.dir(result);
          m.redraw();
        }, (err) => {
          notifyError(`${err.status}: ${err.statusText}`);
        });
      }
    });
  }
};

export default DigestFlagButton;
