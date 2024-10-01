import { notifyError, notifySuccess } from 'controllers/app/notifications';
import moment from 'moment';
import React from 'react';
import {
  useCreateApiKeyMutation,
  useDeleteApiKeyMutation,
  useGetApiKeyQuery,
} from 'state/api/user';
import { saveToClipboard } from 'utils/clipboard';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { openConfirmation } from '../../../modals/confirmation_modal';
import CWIconButton from '../../component_kit/new_designs/CWIconButton';
import ProfileSection from '../Section';
import './ManageAPIKeys.scss';

const ManageApiKey = () => {
  const { mutateAsync: createApiKey } = useCreateApiKeyMutation();
  const { mutateAsync: deleteApiKey } = useDeleteApiKeyMutation();
  const useGetApiKey = useGetApiKeyQuery();

  const handleCreateAPIKey = () => {
    createApiKey({})
      .then((res) => {
        openConfirmation({
          title: 'Important: Save Your Key',
          description: (
            <section className="ManageAPIKeys">
              Your API Key is:
              <br />
              <div className="flex-row">
                <CWText type="b2" className="w-fit" fontWeight="medium">
                  {res.api_key}
                </CWText>
                <CWIconButton
                  iconName="copyNew"
                  buttonSize="med"
                  onClick={() => saveToClipboard(res.api_key, true)}
                />
              </div>
              Save your key in a safe location. You will not be able to see your
              key after you close this modal.
            </section>
          ),
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
      })
      .catch((err) => {
        console.error(err);
        notifyError('Failed to create an API key');
      });
  };

  const handleDeleteAPIKey = () => {
    openConfirmation({
      title: 'Confirm deletion?',
      description: `Are you sure you want to delete this API key. All services using this key will stop working.`,
      buttons: [
        {
          label: 'Delete',
          buttonType: 'destructive',
          buttonHeight: 'sm',
          onClick: () => {
            deleteApiKey({})
              .then(() => {
                notifySuccess('API key deleted');
              })
              .catch((err) => {
                console.error(err);
                notifyError('Failed to delete API key');
              });
          },
        },
      ],
    });
  };

  const existingKeyUI = (
    <section className="flex-row">
      <CWText type="h5">
        API key created on{' '}
        {moment(useGetApiKey?.data?.created_at).format('DD/MM/YYYY')}
      </CWText>
      <CWButton
        label="Delete Key"
        type="button"
        buttonType="destructive"
        buttonWidth="narrow"
        onClick={handleDeleteAPIKey}
      />
    </section>
  );

  const createKeyUI = (
    <section className="flex-row">
      <CWText type="h5">You don&apos;t have any active API key</CWText>
      <CWButton
        label="Create an API Key"
        type="button"
        buttonType="primary"
        buttonWidth="narrow"
        onClick={handleCreateAPIKey}
      />
    </section>
  );

  return (
    <ProfileSection
      title="Api Key"
      description="Manage your Common API key"
      className="ManageAPIKeys"
    >
      {useGetApiKey.data?.hashed_api_key ? existingKeyUI : createKeyUI}
    </ProfileSection>
  );
};

export default ManageApiKey;
