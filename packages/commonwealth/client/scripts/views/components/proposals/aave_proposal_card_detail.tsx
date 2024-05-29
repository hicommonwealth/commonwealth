import React, { useEffect, useState } from 'react';

import 'components/proposals/aave_proposal_card_detail.scss';

import type AaveProposal from 'controllers/chain/ethereum/aave/proposal';
import { CWLabel } from '../component_kit/cw_label';
import { CWText } from '../component_kit/cw_text';
import { User } from '../user/user';

export const roundVote = (percentage) => {
  return percentage.toFixed(2).split('.0')[0].slice(0, 4);
};

type AaveInfoRowProps = { aaveNum: number; aaveText: string };

export const AaveInfoRow = (props: AaveInfoRowProps) => {
  const { aaveNum, aaveText } = props;

  return (
    <div className="AaveInfoRow">
      <CWText type="h5" fontWeight="semiBold" className="aave-num-text">
        {roundVote(aaveNum * 100)}%
      </CWText>
      <CWText noWrap>{aaveText}</CWText>
    </div>
  );
};

type AaveProposalCardDetailProps = {
  proposal: AaveProposal;
  statusText: any;
};

export const AaveProposalCardDetail = (props: AaveProposalCardDetailProps) => {
  const { proposal, statusText } = props;

  const _statusText = Array.isArray(statusText)
    ? statusText[0]?.split(',')[0]
    : statusText;

  const [author, setAuthor] = useState<string>(proposal.ipfsData?.author);
  useEffect(() => {
    // TODO: we need to load titles / description async too
    proposal.ipfsDataReady.once('ready', () =>
      setAuthor(proposal.ipfsData?.author),
    );
  });
  // TODO: move executor display to entire page
  // TODO: display stats about voting turnout/etc
  // const executor = proposal.Executor;

  return (
    <div className="AaveProposalCardDetail">
      <div className="aave-metadata-container">
        <div className="aave-metadata-column">
          <CWLabel label="Author" />
          {author ? (
            <CWText title={author.split(' (')[0]} noWrap>
              {author.split(' (')[0]}
            </CWText>
          ) : (
            <User
              userAddress={proposal?.author?.address}
              userCommunityId={
                proposal?.author?.community?.id ||
                proposal?.author?.profile?.chain
              }
              shouldShowAsDeleted={
                !proposal?.author?.address &&
                !(
                  proposal?.author?.community?.id ||
                  proposal?.author?.profile?.chain
                )
              }
              shouldHideAvatar
              shouldLinkProfile
            />
          )}
        </div>
        <div className="aave-metadata-column">
          <CWLabel label="Status" />
          <CWText noWrap>{_statusText}</CWText>
        </div>
      </div>
      <div className="aave-voting-section">
        <CWLabel label="Voting" />
        <AaveInfoRow aaveNum={proposal.turnout} aaveText="of token holders" />
        <AaveInfoRow aaveNum={proposal.support} aaveText="in favor" />
        <AaveInfoRow
          aaveNum={proposal.voteDifferential}
          aaveText="differential"
        />
      </div>
      <div className="aave-voting-section">
        <CWLabel label="Required to pass" />
        <AaveInfoRow
          aaveNum={proposal.minimumQuorum}
          aaveText="of token holders"
        />
        <AaveInfoRow
          aaveNum={proposal.minimumVoteDifferential}
          aaveText="differential"
        />
      </div>
    </div>
  );
};
