import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useState } from 'react';
import app from 'state';
import { useCreateGroupMutation } from 'state/api/groups';
import useGroupMutationBannerStore from 'state/ui/group';
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

  const { setShouldShowGroupMutationBannerForCommunity } =
    useGroupMutationBannerStore();
  const { mutateAsync: createGroup } = useCreateGroupMutation({
    communityId: app.activeChainId(),
  });

  const { isAddedToHomeScreen } = useAppStatus();

  useBrowserAnalyticsTrack({
    payload: {
      event: MixpanelPageViewEvent.GROUPS_CREATION_PAGE_VIEW,
      isPWA: isAddedToHomeScreen,
    },
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
      onSubmit={async (values) => {
        const payload = makeGroupDataBaseAPIPayload(
          values,
          isAddedToHomeScreen,
          allowedAddresses,
        );

        try {
          await createGroup(payload);
          notifySuccess('Group Created');
          setShouldShowGroupMutationBannerForCommunity(
            app.activeChainId(),
            true,
          );
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
