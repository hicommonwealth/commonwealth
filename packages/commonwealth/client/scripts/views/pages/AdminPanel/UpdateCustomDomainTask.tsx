import React, { useState } from 'react';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import useUpdateCustomDomainMutation from 'state/api/communities/updateCustomDomain';
import { useDebounce } from 'usehooks-ts';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { notifySuccess } from '../../../controllers/app/notifications';
import { CWTextInput } from '../../components/component_kit/new_designs/CWTextInput';
import { openConfirmation } from '../../modals/confirmation_modal';

const UpdateCustomDomainTask = () => {
  const [communityId, setCommunityId] = useState<string>('');
  const [customDomain, setCustomDomain] = useState<string>('');

  const updateCustomDomain = useUpdateCustomDomainMutation();

  const openConfirmationModal = () => {
    openConfirmation({
      title: 'Update Custom Domain',
      // eslint-disable-next-line max-len
      description: `Are you sure you want to update ${communityId}'s custom domain to ${customDomain}? Please ensure engineering has been contacted prior to making this change.`,
      buttons: [
        {
          label: 'Update',
          buttonType: 'destructive',
          buttonHeight: 'sm',
          onClick: () => {
            console.log('communityId', communityId);
            console.log('customDomain', customDomain);
            void (async () => {
              await updateCustomDomain.mutateAsync({
                community_id: communityId,
                custom_domain: customDomain,
              });
              notifySuccess('Custom domain updated');
            })();
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

  const debouncedCommunityId = useDebounce<string | undefined>(
    communityId,
    500,
  );

  const { data: community, isLoading: isLoadingCommunity } =
    useGetCommunityByIdQuery({
      id: debouncedCommunityId || '',
      enabled: !!debouncedCommunityId,
    });
  const communityNotFound =
    !isLoadingCommunity && Object.keys(community || {})?.length === 0;

  const customDomainValidatonError = (() => {
    if (!customDomain) return 'Required';

    const validCustomDomainUrl = new RegExp(
      '^(([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}$',
    );
    // TODO: enhance this validation to ensure a tighter format (no dangling paths)
    if (!validCustomDomainUrl.test(customDomain)) {
      return 'Invalid URL (try removing the http prefix)';
    }
  })();

  return (
    <div className="TaskGroup">
      <CWText type="h4">Update Custom Domain</CWText>
      <CWText type="caption">
        Update a communities custom domain url. Contact engineering before
        changing, and for custom domain removals.
      </CWText>
      <div className="TaskRow">
        <CWTextInput
          label="Community Id"
          value={communityId}
          onInput={(e) => setCommunityId(e?.target?.value?.trim() || '')}
          customError={communityNotFound ? 'Community not found' : ''}
          placeholder="Enter a community id"
          fullWidth
        />
        <CWTextInput
          label="Custom Domain URL"
          value={customDomain}
          onInput={(e) => setCustomDomain(e?.target?.value?.trim() || '')}
          customError={customDomain && customDomainValidatonError}
          placeholder="my.customdomain.com"
          fullWidth
        />
        <CWButton
          label="Update"
          className="TaskButton"
          disabled={communityNotFound || !!customDomainValidatonError}
          onClick={openConfirmationModal}
        />
      </div>
      {updateCustomDomain.isError && (
        <CWText>An error occurred: {updateCustomDomain.error.message}</CWText>
      )}
      {updateCustomDomain.isSuccess && (
        <CWText>
          Successfully created! Send this CNAME to the customer:{' '}
          {updateCustomDomain.data.cname}
        </CWText>
      )}
    </div>
  );
};

export default UpdateCustomDomainTask;
