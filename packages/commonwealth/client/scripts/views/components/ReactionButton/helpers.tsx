import React from 'react';
import app from 'state';
import { User } from 'views/components/user/user';
import { CWText } from '../component_kit/cw_text';

const MAX_VISIBLE_REACTING_ACCOUNTS = 10;

type ReactorProps = {
  reactors: string[];
};

export const getDisplayedReactorsForPopup = ({
  reactors = [],
}: ReactorProps) => {
  const slicedReactors = reactors
    .slice(0, MAX_VISIBLE_REACTING_ACCOUNTS)
    .map((reactorAddress) => {
      return (
        <div
          key={reactorAddress + '#' + (app.chain?.id || app.chain)}
          style={{ display: 'flex', width: '120px' }}
        >
          <CWText noWrap>
            <User
              userAddress={reactorAddress}
              userCommunityId={app.chain.id}
              shouldLinkProfile
            />
          </CWText>
        </div>
      );
    });

  if (reactors.length > MAX_VISIBLE_REACTING_ACCOUNTS) {
    const diff = reactors.length - MAX_VISIBLE_REACTING_ACCOUNTS;

    slicedReactors.push(
      <CWText type="caption" key="final">{`and ${diff} more`}</CWText>,
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {slicedReactors}
    </div>
  );
};
