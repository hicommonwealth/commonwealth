import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import app from 'state';
import { useCreateGroupMutation } from 'state/api/groups';
import useGroupMutationBannerStore from 'state/ui/group';
import Permissions from 'utils/Permissions';
import { MixpanelPageViewEvent } from '../../../../../../../shared/analytics/types';
import { PageNotFound } from '../../../404';
import { GroupForm } from '../common/GroupForm';
import { makeGroupDataBaseAPIPayload } from '../common/helpers';
import './CreateCommunityGroupPage.scss';

const CreateCommunityGroupPage = () => {
  const navigate = useCommonNavigate();
  const { setShouldShowGroupMutationBannerForCommunity } =
    useGroupMutationBannerStore();
  const { mutateAsync: createGroup } = useCreateGroupMutation({
    chainId: app.activeChainId(),
  });

  useBrowserAnalyticsTrack({
    payload: { event: MixpanelPageViewEvent.GROUPS_CREATION_PAGE_VIEW },
  });

  if (
    !app.isLoggedIn() ||
    !(Permissions.isCommunityAdmin() || Permissions.isSiteAdmin())
  ) {
    return <PageNotFound />;
  }

  return (
    <GroupForm
      formType="create"
      initialValues={{
        requirementsToFulfill: 'ALL',
      }}
      onSubmit={(values) => {
        const payload = makeGroupDataBaseAPIPayload(values);

        createGroup(payload)
          .then(() => {
            notifySuccess('Group Created');
            setShouldShowGroupMutationBannerForCommunity(
              app.activeChainId(),
              true,
            );
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
