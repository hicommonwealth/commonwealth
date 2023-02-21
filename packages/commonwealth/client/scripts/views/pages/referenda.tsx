import React from 'react';

import { ChainBase } from 'common-common/src/types';
import type Substrate from 'controllers/chain/substrate/adapter';
import { blockperiodToDuration } from 'helpers';

import 'pages/referenda.scss';

import app from 'state';
import { CountdownUntilBlock } from 'views/components/countdown';
import { loadSubstrateModules } from 'views/components/load_substrate_modules';
import { ProposalCard } from 'views/components/proposal_card';
import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/sublayout';
import { BreadcrumbsTitleTag } from '../components/breadcrumbs_title_tag';
import { CardsCollection } from '../components/cards_collection';
import { GovExplainer } from '../components/gov_explainer';
import ErrorPage from './error';

function getModules() {
  if (!app || !app.chain || !app.chain.loaded) {
    throw new Error('secondary loading cmd called before chain load');
  }
  if (app.chain.base === ChainBase.Substrate) {
    const chain = app.chain as Substrate;

    return [chain.treasury, chain.democracy, chain.democracyProposals];
  } else {
    throw new Error('invalid chain');
  }
}

const ReferendaPage = () => {
  if (!app.chain || !app.chain.loaded) {
    if (
      app.chain?.base === ChainBase.Substrate &&
      (app.chain as Substrate).chain?.timedOut
    ) {
      return (
        <ErrorPage
          message="Could not connect to chain"
          title={<BreadcrumbsTitleTag title="Referenda" />}
        />
      );
    }

    return <PageLoading message="Connecting to chain" />;
  }

  const onSubstrate = app.chain?.base === ChainBase.Substrate;

  const modLoading = loadSubstrateModules('Referenda', getModules);

  if (modLoading) return modLoading;

  // active proposals
  const activeDemocracyReferenda =
    onSubstrate &&
    (app.chain as Substrate).democracy.store
      .getAll()
      .filter((p) => !p.completed);

  const activeProposalContent = !activeDemocracyReferenda?.length ? (
    <div className="no-proposals">None</div>
  ) : (
    (activeDemocracyReferenda || []).map((proposal, i) => (
      <ProposalCard key={i} proposal={proposal} />
    ))
  );

  // inactive proposals
  const inactiveDemocracyReferenda =
    onSubstrate &&
    (app.chain as Substrate).democracy.store
      .getAll()
      .filter((p) => p.completed);

  const inactiveProposalContent = !inactiveDemocracyReferenda?.length ? (
    <div className="no-proposals">None</div>
  ) : (
    (inactiveDemocracyReferenda || []).map((proposal, i) => (
      <ProposalCard key={i} proposal={proposal} />
    ))
  );

  return (
    <Sublayout>
      <div className="ReferendaPage">
        {onSubstrate && (
          <GovExplainer
            statHeaders={[
              {
                statName: 'Referenda',
                statDescription: `are final votes to approve/reject treasury proposals, \
                    upgrade the chain, or change technical parameters.`,
              },
            ]}
            stats={[
              {
                statHeading: 'Next referendum:',
                stat: (app.chain as Substrate).democracyProposals
                  .nextLaunchBlock ? (
                  <CountdownUntilBlock
                    block={
                      (app.chain as Substrate).democracyProposals
                        .nextLaunchBlock
                    }
                  />
                ) : (
                  '--'
                ),
              },
              {
                statHeading: 'Passed referenda are enacted after:',
                stat: `${
                  (app.chain as Substrate).democracy.enactmentPeriod
                    ? blockperiodToDuration(
                        (app.chain as Substrate).democracy.enactmentPeriod
                      ).asDays()
                    : '--'
                } days`,
              },
            ]}
          />
        )}
        <CardsCollection
          content={activeProposalContent}
          header="Active Referenda"
        />
        <CardsCollection
          content={inactiveProposalContent}
          header="Inactive Referenda"
        />
      </div>
    </Sublayout>
  );
};

export default ReferendaPage;
