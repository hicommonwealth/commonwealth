import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { featureFlags } from 'helpers/feature-flags';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import app from 'state';
import { useCreateGroupMutation } from 'state/api/groups';
import Permissions from 'utils/Permissions';
import { PageNotFound } from '../../../404';
import { GroupForm } from '../common/GroupForm';
import { makeGroupDataBaseAPIPayload } from '../common/helpers';
import './CreateCommunityGroupPage.scss';

const CreateCommunityGroupPage = () => {
  const navigate = useCommonNavigate();
  const { mutateAsync: createGroup } = useCreateGroupMutation({
    chainId: app.activeChainId(),
  });

  if (
    !featureFlags.gatingEnabled ||
    !app.isLoggedIn() ||
    !(Permissions.isCommunityAdmin() || Permissions.isSiteAdmin())
  ) {
    return <PageNotFound />;
  }

  return (
    <GroupForm
      formType="create"
      onSubmit={(values) => {
        const payload = makeGroupDataBaseAPIPayload(values);

        createGroup(payload)
          .then(() => {
            notifySuccess('Group Created');
            navigate(`/members?tab=groups`);
          })
          .catch(() => {
            notifyError('Failed to create group');
          });
      }}
    />
  );
};

export default CreateCommunityGroupPage;
