import type { Action, Session } from '@canvas-js/interfaces';
import React, { useEffect, useState } from 'react';

import 'modals/canvas_verify_data_modal.scss';
import {
  CWModalBody,
  CWModalHeader,
} from 'views/components/component_kit/new_designs/CWModal';

type CanvasVerifyDataModalProps = {
  obj: any;
  onClose: () => void;
};

export const CanvasVerifyDataModal = (props: CanvasVerifyDataModalProps) => {
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
    // TODO: implement this using the new canvas fields
    // import('@canvas-js/interfaces').then((canvas) => {
    // setSessionPayload(canvas.serializeSessionPayload(session.payload));
    // setActionPayload(canvas.serializeActionPayload(action.payload));
    // setSessionSignature(session.signature);
    // setActionSignature(action.signature);

    // verify({ session })
    //   .then((result) => setVerifiedSession(result))
    //   .catch((err) => console.error('Could not verify session:', err));
    // verify({
    //   action,
    //   actionSignerAddress: session.payload.sessionAddress,
    // })
    //   .then((result) => setVerifiedAction(result))
    //   .catch((err) => console.error('Could not verify action:', err));
    // });
  }, [obj.canvasAction, obj.canvasSession]);

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
      <CWModalHeader onModalClose={props.onClose} label="Verify Data" />
      <CWModalBody>
        <h3>Action</h3>
        {verifiedAction ? <p>✅ Verified</p> : <p>❌ Invalid</p>}
        {actionPayload && <pre>{actionPayload}</pre>}
        <pre>{actionSignature}</pre>
        <h3>Session</h3>
        {verifiedSession ? <p>✅ Verified</p> : <p>❌ Invalid</p>}
        {sessionPayload && <pre>{sessionPayload}</pre>}
        <pre>{sessionSignature}</pre>
      </CWModalBody>
    </div>
  );
};
