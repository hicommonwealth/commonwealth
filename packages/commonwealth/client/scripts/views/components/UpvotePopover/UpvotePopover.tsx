import React from 'react';
import CWPopover, {
  UsePopoverProps,
} from '../component_kit/new_designs/CWPopover/CWPopover';
import { User } from '../user/user';
import './UpvotePopover.scss';

type UpvotePopoverProps = {
  upvoters: string[];
} & UsePopoverProps;

export const UpvotePopover = ({
  upvoters,
  ...popoverProps
}: UpvotePopoverProps) => {
  const maxVisibleReactingAccounts = 3;

  const getDisplayedReactorsForPopup = (reactors) => {
    const slicedReactors = reactors
      .slice(0, maxVisibleReactingAccounts)
      .map((reactorAddress) => {
        return (
          <div key={reactorAddress} className="upvoter-row">
            <User
              userAddress={reactorAddress}
              // set to 1inch for use on components page
              // userCommunityId={app.chain.id}
              userCommunityId="1inch"
              shouldLinkProfile
            />
            <div className="vote-weight">5x</div>
          </div>
        );
      });

    if (reactors.length > maxVisibleReactingAccounts) {
      slicedReactors.push(
        <div
          className="upvoter-count"
          key="final"
        >{`${reactors.length} votes total`}</div>,
      );
    }

    return (
      <div
        className="upvoters-list"
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        {slicedReactors}
      </div>
    );
  };

  return (
    <CWPopover
      className="UpvotePopover"
      title="Recent Upvotes"
      body={getDisplayedReactorsForPopup(upvoters)}
      {...popoverProps}
    />
  );
};
