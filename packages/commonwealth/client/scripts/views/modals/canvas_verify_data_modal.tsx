import React, { useCallback, useEffect, useState } from 'react';

import 'modals/canvas_verify_data_modal.scss';
import { verify } from 'shared/canvas';
import { CanvasSignedData, deserializeCanvas } from 'shared/canvas/types';
import {
  CWModalBody,
  CWModalHeader,
} from 'views/components/component_kit/new_designs/CWModal';

type CanvasVerifyDataModalProps = {
  obj: any;
  onClose: () => void;
};

export const CanvasVerifyDataModal = (props: CanvasVerifyDataModalProps) => {
  const { obj, onClose } = props;
  const [verifiedCanvasSignedData, setVerifiedCanvasSignedData] =
    useState<CanvasSignedData | null>(null);

  const doVerify = useCallback(async () => {
    try {
      const canvasSignedData: CanvasSignedData = deserializeCanvas(
        obj.canvasSignedData,
      );
      await verify(canvasSignedData);
      setVerifiedCanvasSignedData(canvasSignedData);
    } catch (err) {
      console.log('Unexpected error while verifying action/session');
      return;
    }
  }, [obj.canvasSignedData]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    doVerify();
  }, [doVerify]);

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
      <CWModalHeader onModalClose={onClose} label="Verify Data" />
      <CWModalBody>
        {verifiedCanvasSignedData ? <p>✅ Verified</p> : <p>❌ Invalid</p>}
      </CWModalBody>
    </div>
  );
};
