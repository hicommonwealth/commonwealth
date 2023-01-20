/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import {
  serializeActionPayload,
  serializeSessionPayload,
} from '@canvas-js/interfaces';
import type { Action, Session } from '@canvas-js/interfaces';

import app from 'state';
import { CWButton } from '../components/component_kit/cw_button';
import { verify } from '../../helpers/canvas';

import 'modals/canvas_verify_data_modal.scss';

const CanvasVerifyDataModal = {
  confirmExit: async () => true,
  view(
    vnode: m.Vnode<
      { obj },
      {
        initialized: boolean;
        hash: string;
        action: Action;
        session: Session;
        verifiedAction: boolean;
        verifiedSession: boolean;
      }
    >
  ) {
    const obj = vnode.attrs.obj;

    if (!vnode.state.initialized) {
      vnode.state.initialized = true;
      vnode.state.hash = obj.canvasHash;
      try {
        vnode.state.session = JSON.parse(obj.canvasSession) as Session;
        vnode.state.action = JSON.parse(obj.canvasAction) as Action;
        verify({ session: vnode.state.session })
          .then((result) => (vnode.state.verifiedSession = result))
          .catch((err) => console.error('Could not verify session:', err))
          .finally(() => m.redraw());
        verify({
          action: vnode.state.action,
          actionSignerAddress: vnode.state.session.payload.address,
        })
          .then((result) => (vnode.state.verifiedAction = result))
          .catch((err) => console.error('Could not verify action:', err))
          .finally(() => m.redraw());
      } catch (err) {}
    }

    return (
      <div
        class="CanvasVerifyDataModal"
        onclick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onmousedown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div class="compact-modal-body">
          <h2>Verify Data</h2>
          <div>
            <h3>Action</h3>
            {vnode.state.verifiedAction ? (
              <p>✅ Verified</p>
            ) : (
              <p>❌ Invalid</p>
            )}
            {vnode.state.action && (
              <pre>{serializeActionPayload(vnode.state.action?.payload)}</pre>
            )}
            <pre>{vnode.state.action?.signature}</pre>
            <h3>Session</h3>
            {vnode.state.verifiedSession ? (
              <p>✅ Verified</p>
            ) : (
              <p>❌ Invalid</p>
            )}
            {vnode.state.session && (
              <pre>{serializeSessionPayload(vnode.state.session?.payload)}</pre>
            )}
            <pre>{vnode.state.session?.signature}</pre>
          </div>
        </div>
        <div class="compact-modal-actions">
          <CWButton
            onclick={(e) => {
              e.preventDefault();
              $(e.target).trigger('modalcomplete');
              setTimeout(() => {
                $(e.target).trigger('modalexit');
              }, 0);
            }}
            label="Okay"
          />
        </div>
      </div>
    );
  },
};

export const showCanvasVerifyDataModal = (obj) => {
  return new Promise(() => {
    app.modals.create({
      modal: CanvasVerifyDataModal,
      data: { obj },
    });
  });
};
