import React, { useState } from 'react';

type CodeDialogProps = {
  onVerify: (code: string) => void;
  onCancel: () => void;
};

/**
 * Background dialog that we run along with the store so that we can finish auth.
 */
export const CodeDialog = (props: CodeDialogProps) => {
  const { onVerify, onCancel } = props;
  const [code, setCode] = useState<string>('');

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#ffffff',
        zIndex: 10000,
      }}
    >
      <div>Enter the code on your phone:</div>

      <input onChange={(e) => setCode(e.currentTarget.value)} value={code} />

      <button onClick={() => onVerify(code)}>Verify Code</button>

      <button onClick={onCancel}>cancel</button>
    </div>
  );
};
