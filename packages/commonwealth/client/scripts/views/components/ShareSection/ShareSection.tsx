import { formatAddressShort } from 'helpers';
import { useFlag } from 'hooks/useFlag';
import { uniqBy } from 'lodash';
import React, { useEffect, useState } from 'react';
import app from 'state';
import useUserStore from 'state/ui/user';
import { saveToClipboard } from 'utils/clipboard';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { ShareOptionButton } from 'views/components/ShareSection/ShareOptionButton';
import { useShareOptions } from 'views/components/ShareSection/useShareOptions';
import './ShareSection.scss';

export type ShareSectionProps = {
  url: string;
  title?: string;
  text?: string;
  /**
   * Called when the community ID is changed. you MUST memoize this callback!
   *
   * IF you don't you'll be called in an infinite loop.
   */
  onCommunityChange?: (communityId: string | undefined) => void;
};

/**
 * Create a share section for sharing content.
 *
 * Title and text are only supported on certain providers.
 */
export const ShareSection = (props: ShareSectionProps) => {
  const { title, onCommunityChange, text } = props;

  const referralsEnabled = useFlag('referrals');

  const user = useUserStore();
  const hasJoinedCommunity = !!user.activeAccount;
  const communityId = hasJoinedCommunity ? app.activeChainId() : '';

  const availableAddresses = uniqBy(user.addresses, 'address');

  const addressOptions = availableAddresses.map((addressInfo) => ({
    value: addressInfo.address,
    label: formatAddressShort(addressInfo.address, 6),
  }));
  const refAddress = communityId
    ? user.activeAccount?.address
    : addressOptions?.[0]?.value;

  const [refCode, setRefCode] = useState(refAddress);

  // eslint-disable-next-line react/destructuring-assignment
  const url = computeURLWithReferral(props.url, refCode);

  const shareOptions = useShareOptions(url, title, text);

  const handleCopy = () => {
    saveToClipboard(url, true).catch(console.error);
  };

  const block0 = shareOptions.slice(0, 5);
  const block1 = shareOptions.slice(5, 9);

  useEffect(() => {
    onCommunityChange?.(communityId);
  }, [communityId, onCommunityChange]);

  return (
    <>
      {referralsEnabled && (
        <>
          <CWSelectList
            label="Select Address"
            placeholder="Select a wallet"
            isClearable={false}
            isSearchable={false}
            value={addressOptions.find((option) => option.value === refCode)}
            defaultValue={addressOptions[0]}
            options={addressOptions}
            onChange={(option) => setRefCode(option?.value)}
          />

          <CWTextInput
            inputClassName="invite-link-input"
            fullWidth
            type="text"
            value={url}
            readOnly
            onClick={handleCopy}
            iconRight={<CWIcon iconName="copy" />}
          />
        </>
      )}

      <div className="ShareSection">
        <CWText fontWeight="bold">Share to</CWText>
        <div className="share-options">
          {block0.map((option, idx) => (
            <ShareOptionButton key={idx} {...option} />
          ))}
        </div>
        <div className="share-options">
          {block1.map((option, idx) => (
            <ShareOptionButton key={idx} {...option} />
          ))}
          <div className="share-option" />
          <div className="share-option" />
          <div className="share-option" />
        </div>
      </div>
    </>
  );
};

function computeURLWithReferral(url: string, refcode: string | undefined) {
  if (!refcode) {
    return url;
  }

  const u = new URL(url);
  u.searchParams.set('refcode', refcode);
  return u.toString();
}
