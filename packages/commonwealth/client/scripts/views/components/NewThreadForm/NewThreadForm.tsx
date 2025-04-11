import { useFlag } from 'hooks/useFlag';
import React from 'react';
import useUserStore from 'state/ui/user';
import { NewThreadForm as NewThreadFormLegacy } from '../NewThreadFormLegacy';
import { NewThreadForm as NewThreadFormModern } from '../NewThreadFormModern';

export const NewThreadForm = () => {
  const newEditor = useFlag('newEditor');
  const user = useUserStore();
  if (newEditor) {
    return <NewThreadFormModern key={user.addresses.length} />;
  }

  return <NewThreadFormLegacy key={user.addresses.length} />;
};
