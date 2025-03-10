import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect } from 'react';
import Permissions from 'utils/Permissions';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import UpdateCommunityIdTask from 'views/pages/AdminPanel/UpdateCommunityIdTask';
import UpdateCustomDomainTask from 'views/pages/AdminPanel/UpdateCustomDomainTask';
import { CWDivider } from '../../components/component_kit/cw_divider';
import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import './AdminPanel.scss';
import Analytics from './Analytics';
import ChangeResourceTimestamps from './ChangeResourceTimestamps';
import CommunityTagsManagementTask from './CommunityTagsManagementTask';
import ConnectChainToCommunity from './ConnectChainToCommunityTask';
import DeleteChainTask from './DeleteChainTask';
import DownloadMembersListTask from './DownloadMembersListTask';
import EnableDigestEmail from './EnableDigestEmail';
import MakeSiteAdminTask from './MakeSiteAdminTask';
import RPCEndpointTask from './RPCEndpointTask';
import RefreshCustomDomainTask from './RefreshCustomDomainTask';
import TopUsers from './TopUsers';
import TriggerNotificationsWorkflow from './TriggerNotificationsWorkflow';

const AdminPanelPage = () => {
  const navigate = useCommonNavigate();

  useEffect(() => {
    if (!Permissions.isSiteAdmin()) {
      // redirect to 404
      navigate('/404');
    }
  }, [navigate]);

  return (
    <CWPageLayout>
      <div className="AdminPanel">
        <CWText type="h2">Create Site Assets</CWText>
        <CWButton
          label="Create Quests"
          iconRight="arrowRightPhosphor"
          onClick={() => navigate('/createQuest')}
        />
        <CWDivider />
        <CWText type="h2">Site Analytics</CWText>
        <Analytics />
        <CWDivider />
        <CWText type="h2">Site Admin Tasks</CWText>
        <DeleteChainTask />
        <UpdateCustomDomainTask />
        <RefreshCustomDomainTask />
        <UpdateCommunityIdTask />
        <DownloadMembersListTask />
        <RPCEndpointTask />
        <ConnectChainToCommunity />
        <CommunityTagsManagementTask />
        <MakeSiteAdminTask />
        <TopUsers />
        <TriggerNotificationsWorkflow />
        <EnableDigestEmail />
        <ChangeResourceTimestamps />
      </div>
    </CWPageLayout>
  );
};

export default AdminPanelPage;
