import { decode, parse } from '@ipld/dag-json';
import React, { useEffect, useState } from 'react';

import 'modals/canvas_verify_data_modal.scss';
import { verify } from 'shared/canvas';
import { CanvasSignedData } from 'shared/canvas/types';
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

  useEffect(() => {
    const doUpdate = async () => {
      try {
        const canvasSignedData = decode(
          parse(obj.canvasSignedData),
        ) as CanvasSignedData;
        await verify(canvasSignedData);
        setVerifiedCanvasSignedData(canvasSignedData);
      } catch (err) {
        console.log('Unexpected error while verifying action/session');
        return;
      }
    };
    doUpdate();
  }, [obj.canvasSignedData]);

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
