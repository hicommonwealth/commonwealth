import React, { useEffect, useState } from 'react';
import $ from 'jquery';
import type { Action, Session } from '@canvas-js/interfaces';

import { CWButton } from '../components/component_kit/cw_button';
import { verify } from '../../helpers/canvas';

import 'modals/canvas_verify_data_modal.scss';

type CanvasVerifyDataModalProps = {
  obj: any;
};

const CanvasVerifyDataModal = (props: CanvasVerifyDataModalProps) => {
  const { obj } = props;
  const [actionPayload, setActionPayload] = useState<string | null>();
  const [sessionPayload, setSessionPayload] = useState<string | null>();
  const [actionSignature, setActionSignature] = useState<string | null>();
  const [sessionSignature, setSessionSignature] = useState<string | null>();
  const [verifiedAction, setVerifiedAction] = useState<boolean>(false);
  const [verifiedSession, setVerifiedSession] = useState<boolean>(false);

  useEffect(() => {
    // TODO: display obj.canvasHash
    const session = JSON.parse(obj.canvasSession) as Session;
    const action = JSON.parse(obj.canvasAction) as Action;

    import('@canvas-js/interfaces').then((canvas) => {
      setSessionPayload(canvas.serializeSessionPayload(session.payload));
      setActionPayload(canvas.serializeActionPayload(action.payload));
      setSessionSignature(session.signature);
      setActionSignature(action.signature);

      verify({ session })
        .then((result) => setVerifiedSession(result))
        .catch((err) => console.error('Could not verify session:', err));
      verify({
        action,
        actionSignerAddress: session.payload.sessionAddress,
      })
        .then((result) => setVerifiedAction(result))
        .catch((err) => console.error('Could not verify action:', err));
    });
  }, []);

  return (
    <div
      className="CanvasVerifyDataModal"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div className="compact-modal-body">
        <h2>Verify Data</h2>
        <div>
          <h3>Action</h3>
          {verifiedAction ? <p>✅ Verified</p> : <p>❌ Invalid</p>}
          {actionPayload && <pre>{actionPayload}</pre>}
          <pre>{actionSignature}</pre>
          <h3>Session</h3>
          {verifiedSession ? <p>✅ Verified</p> : <p>❌ Invalid</p>}
          {sessionPayload && <pre>{sessionPayload}</pre>}
          <pre>{sessionSignature}</pre>
        </div>
      </div>
      <div className="compact-modal-actions">
        <CWButton
          onClick={(e) => {
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
};
