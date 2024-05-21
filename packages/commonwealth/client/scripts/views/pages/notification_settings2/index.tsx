import { GetThreadSubscriptions } from '@hicommonwealth/schemas';
import { getThreadUrl } from '@hicommonwealth/shared';
import { getRelativeTimestamp } from 'helpers/dates';
import { useCommonNavigate } from 'navigation/helpers';
import 'pages/notification_settings/index.scss';
import React, { useMemo } from 'react';
import app from 'state';
import { getCommunityUrl } from 'utils';
import { trpc } from 'utils/trpcClient';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { CWCommunityAvatar } from '../../components/component_kit/cw_community_avatar';
import { CWText } from '../../components/component_kit/cw_text';
import { User } from '../../components/user/user';
import { PageLoading } from '../loading';

import { Link } from 'react-router-dom';
import { CWThreadAction } from 'views/components/component_kit/new_designs/cw_thread_action';
import './index.scss';

function useThreadSubscriptions() {
  const threadSubscriptions = trpc.subscription.getThreadSubscriptions.useQuery(
    {},
  );

  return useMemo(() => {
    return {
      ...threadSubscriptions,
      data: threadSubscriptions.data
        ? GetThreadSubscriptions.output.parse(threadSubscriptions.data)
        : threadSubscriptions.data,
    };
  }, [threadSubscriptions]);
}

const NotificationSettingsPage2 = () => {
  const navigate = useCommonNavigate();
  const threadSubscriptions = useThreadSubscriptions();

  if (!threadSubscriptions.data) {
    return <PageLoading />;
  } else if (!app.isLoggedIn()) {
    navigate('/', { replace: true });
    return <PageLoading />;
  }

  return (
    <CWPageLayout>
      <div className="NotificationSettingsPage NotificationSettingsPage2">
        <CWText type="h3" fontWeight="semiBold" className="page-header-text">
          Notification settings
        </CWText>
        <CWText className="page-subheader-text">
          Manage the emails and alerts you receive about your activity
        </CWText>

        {(threadSubscriptions.data || [])
          .filter((current) => current.Thread)
          .map((current) => (
            <div key={current.id} className="SubEntry">
              <div className="SubHeader">
                <div>
                  <CWCommunityAvatar
                    community={{
                      iconUrl: current.Thread.Community.icon_url,
                      name: current.Thread.Community.name,
                    }}
                    size="small"
                  />
                </div>
                <div style={{ marginLeft: '8px' }}>
                  <Link to={getCommunityUrl(current.Thread.Community.name)}>
                    <CWText fontWeight="semiBold">
                      {current.Thread.Community.name}
                    </CWText>
                  </Link>
                </div>

                <div style={{ marginLeft: '8px', marginRight: '8px' }}>•</div>

                <div>
                  <User
                    userAddress={current.Thread.Address.address}
                    userCommunityId={current.Thread.Community.id}
                  />
                </div>

                <div style={{ marginLeft: '8px', marginRight: '8px' }}>•</div>

                <div>
                  {getRelativeTimestamp(current.Thread.created_at.getTime())}
                </div>
              </div>
              <div>
                <CWText type="h4" fontWeight="semiBold">
                  <Link
                    to={getThreadUrl({
                      chain: current.Thread.community_id,
                      id: current.Thread.id,
                      title: current.Thread.title,
                    })}
                  >
                    <CWText type="h4">
                      {decodeURIComponent(current.Thread.title)}
                    </CWText>
                  </Link>
                </CWText>
              </div>

              <div className="SubFooter">
                <CWThreadAction
                  label={`${current.Thread.comment_count}`}
                  action="comment"
                  onClick={(e) => {
                    // e.preventDefault();
                    // onCommentBtnClick();
                  }}
                />
              </div>
            </div>
          ))}
      </div>
    </CWPageLayout>
  );
};

export default NotificationSettingsPage2;
