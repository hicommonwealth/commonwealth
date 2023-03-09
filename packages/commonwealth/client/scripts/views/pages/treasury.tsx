import React, { useState, useEffect } from 'react';

import { formatCoin } from 'adapters/currency';
import { ChainBase } from 'common-common/src/types';
import type Substrate from 'controllers/chain/substrate/adapter';

import 'pages/treasury.scss';

import app from 'state';
import { CountdownUntilBlock } from 'views/components/countdown';
import { loadSubstrateModules } from 'views/components/load_substrate_modules';
import { ProposalCard } from 'views/components/proposal_card';
import ErrorPage from 'views/pages/error';
import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/sublayout';
import { CardsCollection } from '../components/cards_collection';
import { GovExplainer } from '../components/gov_explainer';

function getModules() {
  if (!app || !app.chain || !app.chain.loaded) {
    throw new Error('secondary loading cmd called before chain load');
  }
  if (app.chain.base === ChainBase.Substrate) {
    const chain = app.chain as Substrate;
    return [chain.treasury, chain.democracyProposals, chain.democracy];
  } else {
    throw new Error('invalid chain');
  }
}

const TreasuryPage = () => {
  const [isLoading, setLoading] = useState(!app.chain || !app.chain.loaded)
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

  const modLoading = loadSubstrateModules('Treasury', getModules);

  if (isSubstrateLoading) return modLoading;

  const activeTreasuryProposals =
    onSubstrate &&
    (app.chain as Substrate).treasury.store
      .getAll()
      .filter((p) => !p.completed);

  const activeTreasuryContent = activeTreasuryProposals.length ? (
    activeTreasuryProposals.map((proposal, i) => (
      <ProposalCard key={i} proposal={proposal} />
    ))
  ) : (
    <div className="no-proposals">None</div>
  );

  const inactiveTreasuryProposals =
    onSubstrate &&
    (app.chain as Substrate).treasury.store.getAll().filter((p) => p.completed);

  const inactiveTreasuryContent = inactiveTreasuryProposals.length ? (
    inactiveTreasuryProposals.map((proposal, i) => (
      <ProposalCard key={i} proposal={proposal} />
    ))
  ) : (
    <div className="no-proposals">None</div>
  );

  return (
    <Sublayout>
      <div className="TreasuryPage">
        {onSubstrate && (
          <GovExplainer
            statHeaders={[
              {
                statName: 'Treasury Proposals',
                statDescription: `are used to request funds from the on-chain \
                  treasury. They are approved/rejected by referendum.`,
              },
            ]}
            stats={[
              {
                statHeading: 'Treasury:',
                stat: formatCoin((app.chain as Substrate).treasury.pot),
              },
              {
                statHeading: 'Next spend period:',
                stat: (app.chain as Substrate).treasury.nextSpendBlock ? (
                  <CountdownUntilBlock
                    block={(app.chain as Substrate).treasury.nextSpendBlock}
                  />
                ) : (
                  '--'
                ),
              },
            ]}
          />
        )}
        <CardsCollection
          content={activeTreasuryContent}
          header="Active Treasury Proposals"
        />
        <CardsCollection
          content={inactiveTreasuryContent}
          header="Inactive Treasury Proposals"
        />
      </div>
    </Sublayout>
  );
};

export default TreasuryPage;
