import React from 'react';
import app from 'state';
import { User } from 'views/components/user/user';
import AddressInfo from '../../../models/AddressInfo';
import ChainInfo from '../../../models/ChainInfo';
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
    .map((rxn) => {
      return (
        <div
          key={rxn + '#' + (app.chain?.id || app.chain)}
          style={{ display: 'flex', width: '120px' }}
        >
          <CWText noWrap>
            <User
              user={new AddressInfo(null, rxn, app.chain.id, null)}
              linkify
            />
          </CWText>
        </div>
      );
    });

  if (slicedReactors.length > MAX_VISIBLE_REACTING_ACCOUNTS) {
    const diff = slicedReactors.length - MAX_VISIBLE_REACTING_ACCOUNTS;

    slicedReactors.push(<CWText key="final">{`and ${diff} more`}</CWText>);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {slicedReactors}
    </div>
  );
};
