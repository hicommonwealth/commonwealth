import 'pages/AdminPanel.scss';
import React, { useState } from 'react';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { useDebounce } from 'usehooks-ts';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import { CWTextInput } from '../../components/component_kit/new_designs/CWTextInput';

type CommunityFinderProps = {
  ctaLabel: string;
  onAction?: (communityId: string) => any;
};

const CommunityFinder = ({ ctaLabel, onAction }: CommunityFinderProps) => {
  const [communityLookupId, setCommunityLookupId] = useState<string>('');
  const debouncedCommunityLookupId = useDebounce<string | undefined>(
    communityLookupId,
    500,
  );

  const { data: communityLookupData, isLoading: isLoadingCommunityLookupData } =
    useGetCommunityByIdQuery({
      id: debouncedCommunityLookupId || '',
      enabled: !!debouncedCommunityLookupId,
    });

  return (
    <div className="Row">
      <CWTextInput
        value={communityLookupId}
        onInput={(e) => setCommunityLookupId(e?.target?.value?.trim() || '')}
        customError={
          !isLoadingCommunityLookupData &&
          (!communityLookupData ||
            Object.keys(communityLookupData || {})?.length === 0)
            ? 'Community not found'
            : ''
        }
        placeholder="Enter a community id"
        fullWidth
      />
      <CWButton
        label={ctaLabel}
        className="TaskButton"
        disabled={isLoadingCommunityLookupData}
        onClick={async () => await onAction?.(communityLookupId)}
      />
    </div>
  );
};

export default CommunityFinder;
