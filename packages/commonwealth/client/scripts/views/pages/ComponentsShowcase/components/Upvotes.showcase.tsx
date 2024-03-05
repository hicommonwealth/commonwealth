import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWUpvote } from 'views/components/component_kit/new_designs/cw_upvote';
import CWUpvoteSmall from 'views/components/component_kit/new_designs/CWUpvoteSmall';

const UpvotesShowcase = () => {
  return (
    <>
      <CWText type="h5">Regular</CWText>
      <div className="flex-row">
        <CWUpvote voteCount={87} />
        <CWUpvote voteCount={8887} active />
        <CWUpvote voteCount={99999} disabled />
      </div>

      <CWText type="h5">Small</CWText>
      <div className="flex-row">
        <CWUpvoteSmall
          voteCount={87}
          disabled={false}
          selected={false}
          onClick={undefined}
          popoverContent={<div>Upvoters List</div>}
        />
        <CWUpvoteSmall
          voteCount={8887}
          disabled={false}
          selected={true}
          onClick={undefined}
          popoverContent={<div>Upvoters List</div>}
        />
        <CWUpvoteSmall
          voteCount={99999}
          disabled={true}
          selected={false}
          onClick={undefined}
          popoverContent={<div>Upvoters List</div>}
        />
      </div>
    </>
  );
};

export default UpvotesShowcase;
