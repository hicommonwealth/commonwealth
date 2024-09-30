import { notifyError, notifySuccess } from 'controllers/app/notifications';
import React from 'react';
import {
  useCreateApiKeyMutation,
  useDeleteApiKeyMutation,
  useGetApiKeyQuery,
} from 'state/api/user';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { openConfirmation } from '../../modals/confirmation_modal';
import ProfileSection from './Section';

const ManageApiKey = () => {
  const { mutateAsync: createApiKey } = useCreateApiKeyMutation();
  const { mutateAsync: deleteApiKey } = useDeleteApiKeyMutation();
  const useGetApiKey = useGetApiKeyQuery();

  const openConfirmationModal = (api_key: string) => {
    openConfirmation({
      title: 'Save Your Key',
      description: `
        Your API Key is: ${api_key}

        Save your key in a safe location. You will not be able to see your key
        after you close this modal.
      `,
      buttons: [
        {
          label: 'Close',
          buttonType: 'secondary',
          buttonHeight: 'sm',
          onClick: () => {
            useGetApiKey.refetch().catch((err) => {
              console.error(err);
            });
          },
        },
      ],
    });
  };

  const existingKeyUI = (
    <div>
      <CWText type="h4">
        API key created: {useGetApiKey?.data?.created_at}
      </CWText>
      <CWButton
        label="Delete Key"
        type="button"
        buttonType="destructive"
        buttonWidth="wide"
        onClick={() => {
          deleteApiKey({})
            .then(() => {
              notifySuccess('API key deleted');
            })
            .catch((err) => {
              console.error(err);
              notifyError('Failed to delete API key');
            });
        }}
      />
    </div>
  );
  const createKeyUI = (
    <div>
      <CWButton
        label="Create API Key"
        type="submit"
        buttonType="primary"
        buttonWidth="wide"
        onClick={() => {
          createApiKey({})
            .then((res) => {
              openConfirmationModal(res.api_key);
            })
            .catch((err) => {
              console.error(err);
              notifyError('Failed to create an API key');
            });
        }}
      />
    </div>
  );

  return (
    <ProfileSection title="Api Key" description="Manage your Common API key">
      {useGetApiKey.data?.hashed_api_key ? existingKeyUI : createKeyUI}
    </ProfileSection>
  );
};

export default ManageApiKey;
