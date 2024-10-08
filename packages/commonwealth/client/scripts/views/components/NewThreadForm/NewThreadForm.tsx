import { useFlag } from 'hooks/useFlag';
import React from 'react';
import { NewThreadForm as NewThreadFormLegacy } from '../NewThreadFormLegacy';
import { NewThreadForm as NewThreadFormModern } from '../NewThreadFormModern';

export const NewThreadForm = () => {
  const newEditor = useFlag('newEditor');

  if (newEditor) {
    return <NewThreadFormModern />;
  }

  return <NewThreadFormLegacy />;
};
