import { useFlag } from 'hooks/useFlag';
import { DeltaStatic } from 'quill';
import React from 'react';
import useUserStore from 'state/ui/user';
import { NewThreadForm as NewThreadFormLegacy } from '../NewThreadFormLegacy';
import { NewThreadForm as NewThreadFormModern } from '../NewThreadFormModern';

export interface NewThreadFormProps {
  contentDelta?: DeltaStatic;
  setContentDelta?: (delta: DeltaStatic) => void;
  webSearchEnabled?: boolean;
  setWebSearchEnabled?: (enabled: boolean) => void;
}

export const NewThreadForm = ({
  contentDelta,
  setContentDelta,
  webSearchEnabled,
  setWebSearchEnabled,
}: NewThreadFormProps = {}) => {
  const newEditor = useFlag('newEditor');
  const user = useUserStore();
  if (newEditor) {
    return <NewThreadFormModern key={user.addresses.length} />;
  }

  return (
    <NewThreadFormLegacy
      key={user.addresses.length}
      contentDelta={contentDelta}
      setContentDelta={setContentDelta}
      webSearchEnabled={webSearchEnabled}
      setWebSearchEnabled={setWebSearchEnabled}
    />
  );
};
