import React from 'react';
import app from 'state';
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

  const createUpvoterList = (upvoterAddresses) => {
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
            <div className="vote-weight">5x</div>
          </div>
        );
      });

    if (upvoterAddresses.length > maxVisibleUpvotingAccounts) {
      slicedUpvoters.push(
        <div
          className="upvoter-count"
          key="final"
        >{`${upvoterAddresses.length} votes total`}</div>,
      );
    }

    return <div className="upvoters-list">{slicedUpvoters}</div>;
  };

  return (
    <>
      {upvoters.length > 0 && (
        <CWPopover
          className="UpvotePopover"
          title="Recent Upvotes"
          body={createUpvoterList(upvoters)}
          {...popoverProps}
        />
      )}
    </>
  );
};
