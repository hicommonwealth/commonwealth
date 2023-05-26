import React, { useState, useEffect } from 'react';

import { formatCoin } from 'adapters/currency';
import { ChainBase } from 'common-common/src/types';
import type Substrate from 'controllers/chain/substrate/adapter';
import type { SubstrateTreasuryTip } from 'controllers/chain/substrate/treasury_tip';

import 'pages/tips.scss';

import app from 'state';
import { loadSubstrateModules } from 'views/components/load_substrate_modules';
import { ProposalCard } from 'views/components/ProposalCard';
import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/Sublayout';
import { CardsCollection } from '../components/cards_collection';
import { CWText } from '../components/component_kit/cw_text';
import { GovExplainer } from '../components/gov_explainer';
import { User } from '../components/user/user';
import ErrorPage from './error';

type TipProps = {
  proposal: SubstrateTreasuryTip;
};

const Tip = (props: TipProps) => {
  const { proposal } = props;

  const beneficiary = app.chain.accounts.get(proposal.data.who);

  return (
    <div className="TipDetail">
      <div className="tip-detail-group">
        <CWText
          fontWeight="medium"
          type="caption"
          className="reason-header-text"
        >
          Reason
        </CWText>
        <CWText
          className="reason-text"
          type="caption"
          title={proposal.data.reason}
        >
          {proposal.data.reason}
        </CWText>
      </div>
      <div className="tip-detail-group">
        <CWText
          fontWeight="medium"
          type="caption"
          className="reason-header-text"
        >
          Beneficiary
        </CWText>
        <User user={beneficiary} popover showAddressWithDisplayName />
      </div>
    </div>
  );
};

function getModules() {
  if (!app || !app.chain || !app.chain.loaded) {
    throw new Error('secondary loading cmd called before chain load');
  }
  if (app.chain.base === ChainBase.Substrate) {
    const chain = app.chain as Substrate;
    return [chain.treasury, chain.tips];
  } else {
    throw new Error('invalid chain');
  }
}

const TipsPage = () => {
  const [isLoading, setLoading] = useState(!app.chain || !app.chain.loaded);
  const [isSubstrateLoading, setSubstrateLoading] = useState(false);

  useEffect(() => {
    app.chainAdapterReady.on('ready', () => setLoading(false));
    app.chainModuleReady.on('ready', () => setSubstrateLoading(false));

    return () => {
      app.chainAdapterReady.off('ready', () => setLoading(false));
      app.chainModuleReady.off('ready', () => setSubstrateLoading(false));
    };
  }, [setLoading, setSubstrateLoading]);

  if (isLoading) {
    if (
      app.chain?.base === ChainBase.Substrate &&
      (app.chain as Substrate).chain?.timedOut
    ) {
      return <ErrorPage message="Could not connect to chain" />;
    }

    return <PageLoading message="Connecting to chain" />;
  }

  const onSubstrate = app.chain?.base === ChainBase.Substrate;

  const modLoading = loadSubstrateModules('Tips', getModules);

  if (isSubstrateLoading) return modLoading;

  const activeTips =
    onSubstrate &&
    (app.chain as Substrate).tips.store.getAll().filter((p) => !p.completed);

  const inactiveTips =
    onSubstrate &&
    (app.chain as Substrate).tips.store.getAll().filter((p) => p.completed);

  const activeTipContent = activeTips.length ? (
    activeTips.map((tip) => (
      <ProposalCard proposal={tip} injectedContent={<Tip proposal={tip} />} />
    ))
  ) : (
    <div className="no-proposals">None</div>
  );

  const inactiveTipContent = inactiveTips.length ? (
    inactiveTips.map((tip) => (
      <ProposalCard proposal={tip} injectedContent={<Tip proposal={tip} />} />
    ))
  ) : (
    <div className="no-proposals">None</div>
  );

  return (
    <Sublayout>
      <div className="TipsPage">
        <GovExplainer
          statHeaders={[
            {
              statName: 'Tips',
              statDescription: `are rewards paid by the treasury without first \
                having a pre-determined stakeholder group come to consensus on payment amount.`,
            },
          ]}
          stats={[
            {
              statHeading: 'Treasury:',
              stat:
                app.chain && formatCoin((app.chain as Substrate).treasury.pot),
            },
          ]}
        />
        <CardsCollection content={activeTipContent} header="Active Tips" />
        <CardsCollection content={inactiveTipContent} header="Inactive Tips" />
      </div>
    </Sublayout>
  );
};

export default TipsPage;
