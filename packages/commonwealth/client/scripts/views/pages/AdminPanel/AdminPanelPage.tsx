import { useCommonNavigate } from 'navigation/helpers';
import 'pages/AdminPanel.scss';
import React, { useEffect } from 'react';
import app from 'state';
import UpdateCommunityIdTask from 'views/pages/AdminPanel/UpdateCommunityIdTask';
import { CWDivider } from '../../components/component_kit/cw_divider';
import { CWText } from '../../components/component_kit/cw_text';
import Analytics from './Analytics';
import DeleteChainTask from './DeleteChainTask';
import DownloadMembersListTask from './DownloadMembersListTask';
import MakeSiteAdminTask from './MakeSiteAdminTask';
import RPCEndpointTask from './RPCEndpointTask';
import TopUsers from './TopUsers';

const AdminPanelPage = () => {
  const navigate = useCommonNavigate();

  useEffect(() => {
    if (!app.user.isSiteAdmin) {
      // redirect to 404
      navigate('/404');
    }
  }, [navigate]);

  return (
    <div className="AdminPanel">
      <CWText type="h2">Site Analytics</CWText>
      <Analytics />
      <CWDivider />
      <CWText type="h2">Site Admin Tasks</CWText>
      <DeleteChainTask />
      <UpdateCommunityIdTask />
      <DownloadMembersListTask />
      <RPCEndpointTask />
      <MakeSiteAdminTask />
      <TopUsers />
    </div>
  );
};

export default AdminPanelPage;
