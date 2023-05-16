import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect } from 'react';
import app from 'state';
import Sublayout from '../../Sublayout';
import { CWText } from '../../components/component_kit/cw_text';
import DeleteChainTask from './DeleteChainTask';
import MakeSiteAdminTask from './MakeSiteAdminTask';
import RPCEndpointTask from './RPCEndpointTask';
import 'pages/admin_panel.scss';

const AdminPanelPage = () => {
  const navigate = useCommonNavigate();

  useEffect(() => {
    if (!app.user.isSiteAdmin) {
      // redirect to 404
      navigate('/404');
    }
  }, [navigate]);

  return (
    <Sublayout
    // title={title}
    >
      <div className="AdminPanel">
        <CWText type="h2">Site Admin Tasks</CWText>
        <DeleteChainTask />
        <RPCEndpointTask />
        <MakeSiteAdminTask />
      </div>
    </Sublayout>
  );
};

export default AdminPanelPage;
