import { useEnableDigestEmail } from 'client/scripts/state/api/superAdmin';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import React, { useState } from 'react';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { useDebounce } from 'usehooks-ts';
import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import { CWTextInput } from '../../components/component_kit/new_designs/CWTextInput';
import './AdminPanel.scss';

const EnableDigestEmail = () => {
  const [communityId, setCommunityId] = useState<string>('');
  const debouncedCommunityLookupId = useDebounce<string | undefined>(
    communityId,
    500,
  );
  const { mutateAsync: triggerEnableDigestEmail } = useEnableDigestEmail();

  const { data: communityLookupData, isLoading: isLoadingCommunityLookupData } =
    useGetCommunityByIdQuery({
      id: debouncedCommunityLookupId || '',
      enabled: !!debouncedCommunityLookupId,
    });

  const setCommunityIdInput = (e) => {
    setCommunityId(e?.target?.value?.trim() || '');
  };

  const communityNotFound =
    !isLoadingCommunityLookupData &&
    (!communityLookupData ||
      Object.keys(communityLookupData || {})?.length === 0);

  const communityIdInputError = (() => {
    if (communityNotFound) return 'Community not found';
    return '';
  })();

  const buttonEnabled =
    !isLoadingCommunityLookupData &&
    communityId.length > 0 &&
    !communityNotFound;

  const update = () => {
    if (Object.keys(communityLookupData || {}).length > 0) {
      try {
        triggerEnableDigestEmail({ communityId }).catch(console.error);
        notifySuccess('Success');
      } catch (error) {
        notifyError('Error');
        console.error(error);
      }
    }
  };

  return (
    <div className="TaskGroup">
      <CWText type="h4">Enable Digest email for Admin</CWText>
      <div className="TaskRow">
        <CWTextInput
          label="Community Id"
          value={communityId}
          onInput={setCommunityIdInput}
          customError={communityIdInputError}
          placeholder="Enter a community id"
        />
        <CWButton
          label="Enable"
          className="TaskButton"
          disabled={!buttonEnabled}
          onClick={update}
        />
      </div>
    </div>
  );
};

export default EnableDigestEmail;
