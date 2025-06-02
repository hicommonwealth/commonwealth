import React from 'react';
import { CodeDialog } from './dialogs/CodeDialog';

export const PrivyTest = () => {
  return (
    <div>
      <CodeDialog
        onComplete={(code: string) => console.log('verify: code: ' + code)}
        onCancel={() => {}}
        headerText="Verify your identity"
      />
    </div>
  );
};
