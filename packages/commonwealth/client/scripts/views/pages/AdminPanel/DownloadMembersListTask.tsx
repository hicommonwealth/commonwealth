import { notifySuccess, notifyError } from 'controllers/app/notifications';
import React, { useEffect, useState } from 'react';
import app from 'state';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { openConfirmation } from '../../modals/confirmation_modal';
import 'pages/AdminPanel.scss';
import { ValidationStatus } from '../../components/component_kit/cw_validation_text';
import { getCSVContent } from './utils';

const DownloadMembersListTask = () => {
  const [communityId, setCommunityId] = useState<string>('');
  const [communityIdValidated, setCommunityIdValidated] =
    useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [loadingDots, setLoadingDots] = useState('');

  useEffect(() => {
    if (isDownloading) {
      const interval = setInterval(() => {
        setLoadingDots((prevDots) => {
          if (prevDots.length < 3) {
            return prevDots + '.';
          } else {
            return '';
          }
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isDownloading]);

  const openConfirmationModal = () => {
    openConfirmation({
      title: 'Download Members List',
      description: `This will download a CSV file with member information for ${communityId}. This can take a few seconds.`,
      buttons: [
        {
          label: 'Download',
          buttonType: 'primary',
          buttonHeight: 'sm',
          onClick: async () => {
            try {
              setIsDownloading(true);
              const res = await getCSVContent({ id: communityId });

              // Download CSV
              const labels = [
                'address',
                'profile_name',
                'thread_count',
                'comment_count',
                'reaction_count',
              ];
              const csvContent = [
                labels,
                ...res.map((obj) => Object.values(obj)),
              ]
                .map((row) => row.join(','))
                .join('\n');
              const blob = new Blob([csvContent], {
                type: 'text/csv;charset=utf-8;',
              });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `${communityId}_members_list.csv`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              setIsDownloading(false);

              setCommunityId('');
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

  const onInput = (e) => {
    setCommunityId(e.target.value);
    if (e.target.value.length === 0) setCommunityIdValidated(false);
  };

  const validationFn = (value: string): [ValidationStatus, string] | [] => {
    if (!app.config.chains.getById(value)) {
      setCommunityIdValidated(false);
      return ['failure', 'Community not found'];
    }
    setCommunityIdValidated(true);
    return [];
  };

  return (
    <div className="TaskGroup">
      <CWText type="h4">Download Members List</CWText>
      <CWText type="caption">
        Downloads a list of members for a CW community (chain) from the DB.
      </CWText>
      <div className="TaskRow">
        <CWTextInput
          value={communityId}
          onInput={onInput}
          inputValidationFn={validationFn}
          placeholder="Enter a community id"
        />
        {isDownloading ? (
          <div className="Downloading">
            <CWText>{`Downloading${loadingDots}`}</CWText>
          </div>
        ) : (
          <CWButton
            label="Download"
            className="TaskButton"
            disabled={!communityIdValidated}
            onClick={openConfirmationModal}
          />
        )}
      </div>
    </div>
  );
};

export default DownloadMembersListTask;
