/* @jsx m */

import m from 'mithril';

import 'pages/treasury.scss';

import app from 'state';
import { formatCoin } from 'adapters/currency';
import { ChainBase } from 'common-common/src/types';
import Substrate from 'controllers/chain/substrate/main';
import Sublayout from 'views/sublayout';
import { PageLoading } from 'views/pages/loading';
import { ProposalCard } from 'views/components/proposal_card';
import { CountdownUntilBlock } from 'views/components/countdown';
import ErrorPage from 'views/pages/error';
import { loadSubstrateModules } from 'views/components/load_substrate_modules';
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
      chain.council,
      chain.treasury,
      chain.democracyProposals,
      chain.democracy,
    ];
  } else {
    throw new Error('invalid chain');
  }
}

class TreasuryPage implements m.ClassComponent {
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
            title={<BreadcrumbsTitleTag title="Treasury" />}
          />
        );
      }

      return (
        <PageLoading
          message="Connecting to chain"
          title={<BreadcrumbsTitleTag title="Referenda" />}
          showCreateContentMenuTrigger
        />
      );
    }
    const onSubstrate = app.chain && app.chain.base === ChainBase.Substrate;

    const modLoading = loadSubstrateModules('Treasury', getModules);

    if (modLoading) return modLoading;

    const activeTreasuryProposals =
      onSubstrate &&
      (app.chain as Substrate).treasury.store
        .getAll()
        .filter((p) => !p.completed);

    const activeTreasuryContent = activeTreasuryProposals.length ? (
      activeTreasuryProposals.map((proposal) => (
        <ProposalCard proposal={proposal} />
      ))
    ) : (
      <div class="no-proposals">None</div>
    );

    const inactiveTreasuryProposals =
      onSubstrate &&
      (app.chain as Substrate).treasury.store
        .getAll()
        .filter((p) => p.completed);

    const inactiveTreasuryContent = inactiveTreasuryProposals.length ? (
      inactiveTreasuryProposals.map((proposal) => (
        <ProposalCard proposal={proposal} />
      ))
    ) : (
      <div class="no-proposals">None</div>
    );

    return (
      <Sublayout
        title={<BreadcrumbsTitleTag title="Referenda" />}
        showCreateContentMenuTrigger
      >
        <div class="TreasuryPage">
          {onSubstrate && (
            <GovExplainer
              statHeaders={[
                {
                  statName: 'Treasury Proposals',
                  statDescription: `are used to request funds from the on-chain \
                  treasury. They are approved/rejected by referendum or council.`,
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
                      includeSeconds={false}
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
  }
}

export default TreasuryPage;
