import React from 'react';
import { useCreateApiKeyMutation } from 'state/api/user';
import ProfileSection from './Section';

const ManageApiKey = () => {
  const { mutateAsync: createApiKey } = useCreateApiKeyMutation();

  return (
    <ProfileSection
      title="Api Key"
      description="Manage your Common API key"
    ></ProfileSection>
  );
};

export default ManageApiKey;
