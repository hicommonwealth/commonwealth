import React from 'react';

import type { SubstrateTreasuryTip } from 'controllers/chain/substrate/treasury_tip';

import 'pages/tip_detail.scss';

import app from 'state';
import { MarkdownFormattedText } from '../components/quill/markdown_formatted_text';
import { User } from '../components/user/user';
import Sublayout from '../sublayout';

type TipDetailProps = {
  proposal: SubstrateTreasuryTip;
};

export const TipDetail = (props: TipDetailProps) => {
  const { proposal } = props;

  const {
    author,
    title,
    data: { who, reason },
  } = proposal;

  const contributors = proposal.getVotes();

  return (
    <Sublayout>
      <div className="TipDetail">
        <div className="tip-details">
          <div className="title">{title}</div>
          <div className="proposal-page-row">
            <div className="label">Finder</div>
            <User user={author} linkify popover showAddressWithDisplayName />
          </div>
          <div className="proposal-page-row">
            <div className="label">Beneficiary</div>
            <User
              user={app.profiles.getProfile(proposal.author.chain.id, who)}
              linkify
              popover
              showAddressWithDisplayName
            />
          </div>
          <div className="proposal-page-row">
            <div className="label">Reason</div>
            <div className="tip-reason">
              {reason && <MarkdownFormattedText doc={reason} />}
            </div>
          </div>
          <div className="proposal-page-row">
            <div className="label">Amount</div>
            <div className="amount">
              <div className="denominator">{proposal.support.denom}</div>
              <div>{proposal.support.inDollars}</div>
            </div>
          </div>
        </div>
        <div className="tip-contributions">
          {contributors.length > 0 && (
            <>
              <div className="contributors title">Contributors</div>
              {contributors.map(({ account, deposit }) => (
                <div className="contributors-row">
                  <div className="amount">
                    <div className="denominator">{deposit.denom}</div>
                    <div>{deposit.inDollars}</div>
                  </div>
                  <User
                    user={account}
                    linkify
                    popover
                    showAddressWithDisplayName
                  />
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </Sublayout>
  );
};
