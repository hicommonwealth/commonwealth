/* @jsx m */

import m from 'mithril';

import 'pages/referenda.scss';

import app from 'state';
import { blockperiodToDuration } from 'helpers';
import { ChainBase } from 'common-common/src/types';
import Substrate from 'controllers/chain/substrate/main';
import Sublayout from 'views/sublayout';
import { PageLoading } from 'views/pages/loading';
import { ProposalCard } from 'views/components/proposal_card';
import { CountdownUntilBlock } from 'views/components/countdown';
import { loadSubstrateModules } from 'views/components/load_substrate_modules';
import ErrorPage from './error';
import { CardsCollection } from '../components/cards_collection';
import { BreadcrumbsTitleTag } from '../components/breadcrumbs_title_tag';
import { GovExplainer } from '../components/gov_explainer';

function getModules() {
  if (!app || !app.chain || !app.chain.loaded) {
    throw new Error('secondary loading cmd called before chain load');
  }
  if (app.chain.base === ChainBase.Substrate) {
    const chain = app.chain as Substrate;

    return [
      chain.treasury,
      chain.democracy,
      chain.democracyProposals,
      chain.council,
    ];
  } else {
    throw new Error('invalid chain');
  }
}

class ReferendaPage implements m.ClassComponent {
  oncreate() {
    const returningFromThread =
      app.lastNavigatedBack() && app.lastNavigatedFrom().includes(`/proposal/`);

    if (
      returningFromThread &&
      localStorage[`${app.activeChainId()}-proposals-scrollY`]
    ) {
      setTimeout(() => {
        window.scrollTo(
          0,
          Number(localStorage[`${app.activeChainId()}-proposals-scrollY`])
        );
      }, 100);
    }
  }

  view() {
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

      return (
        <PageLoading
          message="Connecting to chain"
          title={<BreadcrumbsTitleTag title="Referenda" />}
        />
      );
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
      <div class="no-proposals">None</div>
    ) : (
      (activeDemocracyReferenda || []).map((proposal) => (
        <ProposalCard proposal={proposal} />
      ))
    );

    // inactive proposals
    const inactiveDemocracyReferenda =
      onSubstrate &&
      (app.chain as Substrate).democracy.store
        .getAll()
        .filter((p) => p.completed);

    const inactiveProposalContent = !inactiveDemocracyReferenda?.length ? (
      <div class="no-proposals">None</div>
    ) : (
      (inactiveDemocracyReferenda || []).map((proposal) => (
        <ProposalCard proposal={proposal} />
      ))
    );

    return (
      <Sublayout
      // title={<BreadcrumbsTitleTag title="Referenda" />}
      >
        <div class="ReferendaPage">
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
                      includeSeconds={false}
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
  }
}

export default ReferendaPage;
