import { notifyError, notifySuccess } from 'controllers/app/notifications';
import React, { useState } from 'react';
import { CWText } from '../../components/component_kit/cw_text';
import { openConfirmation } from '../../modals/confirmation_modal';
import './AdminPanel.scss';
import CommunityFinder from './CommunityFinder';
import { downloadCSV, getCSVContent } from './utils';

const DownloadMembersListTask = () => {
  const [componentKey, setComponentKey] = useState(1);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const openConfirmationModal = (communityId: string) => {
    openConfirmation({
      title: 'Download Members List',
      description: `
        This will download a CSV file with member information for ${communityId}. 
        This can take a few seconds.
      `,
      buttons: [
        {
          label: 'Download',
          buttonType: 'primary',
          buttonHeight: 'sm',
          onClick: async () => {
            try {
              setIsDownloading(true);
              const res = await getCSVContent({ id: communityId });
              downloadCSV(res, `${communityId}_members_list.csv`);
              setIsDownloading(false);
              setComponentKey((k) => k + 1);
              notifySuccess('Members list downloaded');
            } catch (e) {
              notifyError('Error downloading members list');
              console.error(e);
            }
          },
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
        onAction={(communityId) => openConfirmationModal(communityId)}
      />
    </div>
  );
};

export default DownloadMembersListTask;
