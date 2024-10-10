import { buildCreateGroupInput } from 'client/scripts/state/api/groups/createGroup';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useState } from 'react';
import app from 'state';
import { useCreateGroupMutation } from 'state/api/groups';
import useGroupMutationBannerStore from 'state/ui/group';
import useUserStore from 'state/ui/user';
import Permissions from 'utils/Permissions';
import { MixpanelPageViewEvent } from '../../../../../../../shared/analytics/types';
import useAppStatus from '../../../../../hooks/useAppStatus';
import { PageNotFound } from '../../../404';
import { GroupForm } from '../common/GroupForm';
import { makeGroupDataBaseAPIPayload } from '../common/helpers';
import './CreateCommunityGroupPage.scss';

const CreateCommunityGroupPage = () => {
  const navigate = useCommonNavigate();
  const [allowedAddresses, setAllowedAddresses] = useState([]);
  const user = useUserStore();

  const { setShouldShowGroupMutationBannerForCommunity } =
    useGroupMutationBannerStore();
  const communityId = app.activeChainId() || '';
  const { mutateAsync: createGroup } = useCreateGroupMutation({
    communityId,
  });

  const { isAddedToHomeScreen } = useAppStatus();

  useBrowserAnalyticsTrack({
    payload: {
      event: MixpanelPageViewEvent.GROUPS_CREATION_PAGE_VIEW,
      isPWA: isAddedToHomeScreen,
    },
  });

  if (
    !user.isLoggedIn ||
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
      onSubmit={async (values) => {
        try {
          const payload = buildCreateGroupInput(
            makeGroupDataBaseAPIPayload(values, allowedAddresses),
          );
          await createGroup(payload);
          notifySuccess('Group Created');
          setShouldShowGroupMutationBannerForCommunity(communityId, true);
          navigate(`/members?tab=groups`);
        } catch (error) {
          notifyError('Failed to create group');
        }
      }}
      allowedAddresses={allowedAddresses}
      setAllowedAddresses={setAllowedAddresses}
    />
  );
};

export default CreateCommunityGroupPage;
