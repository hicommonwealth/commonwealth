import useGetMembersStatsQuery from 'client/scripts/state/api/superAdmin/getMembersStats';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import React, { useState } from 'react';
import { CWText } from '../../components/component_kit/cw_text';
import { openConfirmation } from '../../modals/confirmation_modal';
import './AdminPanel.scss';
import CommunityFinder from './CommunityFinder';
import { downloadCSV } from './utils';

const DownloadMembersListTask = () => {
  const [componentKey, setComponentKey] = useState(1);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [communityId, setCommunityId] = useState<string>('');
  const { data: membersStats, isLoading: membersStatsLoading } =
    useGetMembersStatsQuery({ communityId });

  React.useEffect(() => {
    if (!membersStatsLoading && membersStats) {
      try {
        setIsDownloading(true);
        downloadCSV(membersStats.members, `${communityId}_members_list.csv`);
        setIsDownloading(false);
        setComponentKey((k) => k + 1);
        notifySuccess('Members list downloaded');
      } catch (e) {
        notifyError('Error downloading members list');
        console.error(e);
      }
    }
  }, [membersStats, membersStatsLoading, communityId]);

  const openConfirmationModal = (community_id: string) => {
    openConfirmation({
      title: 'Download Members List',
      description: `
        This will download a CSV file with member information for ${community_id}. 
        This can take a few seconds.
      `,
      buttons: [
        {
          label: 'Download',
          buttonType: 'primary',
          buttonHeight: 'sm',
          onClick: () => setCommunityId(community_id),
        },
        {
          label: 'Cancel',
          buttonType: 'secondary',
          buttonHeight: 'sm',
        },
      ],
    });
  };

  return (
    <div className="TaskGroup" key={componentKey}>
      <CWText type="h4">Download Members List</CWText>
      <CWText type="caption">
        Downloads a list of members for a CW community (chain) from the DB.
      </CWText>
      <CommunityFinder
        ctaLabel="Download"
        actionDisabled={isDownloading}
        onAction={(community_id) => openConfirmationModal(community_id)}
      />
    </div>
  );
};

export default DownloadMembersListTask;
