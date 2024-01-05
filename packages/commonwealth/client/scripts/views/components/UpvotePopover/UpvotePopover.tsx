import React from 'react';
import { isMobile } from 'react-device-detect';
import app from 'state';
import { CWText } from '../component_kit/cw_text';
import CWIconButton from '../component_kit/new_designs/CWIconButton';
import CWPopover, {
  UsePopoverProps,
} from '../component_kit/new_designs/CWPopover/CWPopover';
import { User } from '../user/user';
import './UpvotePopover.scss';

type UpvotePopoverProps = {
  upvoters: string[];
} & UsePopoverProps;

export const UpvotePopover = ({
  upvoters = [],
  ...popoverProps
}: UpvotePopoverProps) => {
  const maxVisibleUpvotingAccounts = 3;

  const createUpvoterList = (upvoterAddresses: string[]) => {
    const slicedUpvoters = upvoterAddresses
      .slice(0, maxVisibleUpvotingAccounts)
      .map((upvoterAddress) => {
        return (
          <div key={upvoterAddress} className="upvoter-row">
            <User
              userAddress={upvoterAddress}
              // set to 1inch for use on components page
              userCommunityId={app.chain?.id || '1inch'}
              avatarSize={24}
              shouldLinkProfile
            />
            <CWText className="vote-weight" type="b2">
              5x
            </CWText>
          </div>
        );
      });

    if (upvoterAddresses.length > maxVisibleUpvotingAccounts) {
      slicedUpvoters.push(
        <CWText
          type="caption"
          className="upvoter-count"
          key="final"
        >{`${upvoterAddresses.length} votes total`}</CWText>,
      );
    }

    return <div className="upvoters-list">{slicedUpvoters}</div>;
  };

  return (
    <>
      {upvoters.length > 0 && (
        <CWPopover
          className="UpvotePopover"
          title={
            <>
              Recent Upvotes
              {isMobile && (
                <div className="close">
                  <CWIconButton
                    iconName="close"
                    buttonSize="sm"
                    onClick={popoverProps.handleInteraction}
                  />
                </div>
              )}
            </>
          }
          body={createUpvoterList(upvoters)}
          {...popoverProps}
        />
      )}
    </>
  );
};
