/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'pages/treasury.scss';

import app from 'state';
import { formatCoin } from 'adapters/currency';
import { ChainBase } from 'common-common/src/types';
import Substrate from 'controllers/chain/substrate/adapter';
import Sublayout from 'views/sublayout';
import { PageLoading } from 'views/pages/loading';
import { ProposalCard } from 'views/components/proposal_card';
import { CountdownUntilBlock } from 'views/components/countdown';
import ErrorPage from 'views/pages/error';
import { loadSubstrateModules } from 'views/components/load_substrate_modules';
import chainState from 'chainState';
import navState from 'navigationState';
import { CardsCollection } from '../components/cards_collection';
import { BreadcrumbsTitleTag } from '../components/breadcrumbs_title_tag';
import { GovExplainer } from '../components/gov_explainer';

function getModules() {
  if (!app || !chainState.chain || !chainState.chain.loaded) {
    throw new Error('secondary loading cmd called before chain load');
  }
  if (chainState.chain.base === ChainBase.Substrate) {
    const chain = chainState.chain as Substrate;
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

class TreasuryPage extends ClassComponent {
  oncreate() {
    const returningFromThread =
      navState.lastNavigatedBack() && navState.lastNavigatedFrom().includes(`/proposal/`);
    if (
      returningFromThread &&
      localStorage[`${navState.activeChainId()}-proposals-scrollY`]
    ) {
      setTimeout(() => {
        window.scrollTo(
          0,
          Number(localStorage[`${navState.activeChainId()}-proposals-scrollY`])
        );
      }, 100);
    }
  }

  view() {
    if (!chainState.chain || !chainState.chain.loaded) {
      if (
        chainState.chain?.base === ChainBase.Substrate &&
        (chainState.chain as Substrate).chain?.timedOut
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
          // title={<BreadcrumbsTitleTag title="Referenda" />}
        />
      );
    }
    const onSubstrate = chainState.chain && chainState.chain.base === ChainBase.Substrate;

    const modLoading = loadSubstrateModules('Treasury', getModules);

    if (modLoading) return modLoading;

    const activeTreasuryProposals =
      onSubstrate &&
      (chainState.chain as Substrate).treasury.store
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
      (chainState.chain as Substrate).treasury.store
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
      // title={<BreadcrumbsTitleTag title="Referenda" />}
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
                  stat: formatCoin((chainState.chain as Substrate).treasury.pot),
                },
                {
                  statHeading: 'Next spend period:',
                  stat: (chainState.chain as Substrate).treasury.nextSpendBlock ? (
                    <CountdownUntilBlock
                      block={(chainState.chain as Substrate).treasury.nextSpendBlock}
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
