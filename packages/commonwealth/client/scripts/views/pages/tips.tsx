/* @jsx m */

import m from 'mithril';

import 'pages/tips.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { formatCoin } from 'adapters/currency';
import { ProposalType, ChainBase } from 'common-common/src/types';
import Substrate from 'controllers/chain/substrate/main';
import { SubstrateTreasuryTip } from 'controllers/chain/substrate/treasury_tip';
import Sublayout from 'views/sublayout';
import { PageLoading } from 'views/pages/loading';
import { ProposalCard } from 'views/components/proposal_card/proposal_card';
import { loadSubstrateModules } from 'views/components/load_substrate_modules';
import ErrorPage from './error';
import User from '../components/widgets/user';
import { CardsCollection } from '../components/cards_collection';
import { CWButton } from '../components/component_kit/cw_button';
import { GovExplainer } from '../components/gov_explainer';
import { BreadcrumbsTitleTag } from '../components/breadcrumbs_title_tag';
import { CWText } from '../components/component_kit/cw_text';

class TipDetail
  implements m.ClassComponent<{ proposal: SubstrateTreasuryTip }>
{
  view(vnode) {
    const { proposal } = vnode.attrs;
    const beneficiary = app.chain.accounts.get(proposal.data.who);

    return (
      <div class="TipDetail">
        <div class="tip-detail-group">
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
        <div class="tip-detail-group">
          <CWText
            fontWeight="medium"
            type="caption"
            className="reason-header-text"
          >
            Beneficiary
          </CWText>
          {m(User, {
            user: beneficiary,
            popover: true,
            showAddressWithDisplayName: true,
          })}
        </div>
      </div>
    );
  }
}

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

class TipsPage implements m.ClassComponent {
  view() {
    const activeAccount = app.user.activeAccount;

    if (!app.chain || !app.chain.loaded) {
      if (
        app.chain?.base === ChainBase.Substrate &&
        (app.chain as Substrate).chain?.timedOut
      ) {
        return (
          <ErrorPage
            message="Chain connection timed out"
            title={<BreadcrumbsTitleTag title="Tips" />}
          />
        );
      }

      return (
        <PageLoading
          message="Connecting to chain"
          title={<BreadcrumbsTitleTag title="Tips" />}
          showNewProposalButton
        />
      );
    }

    const modLoading = loadSubstrateModules('Tips', getModules);

    if (modLoading) return modLoading;

    const activeTips = (app.chain as Substrate).tips.store
      .getAll()
      .filter((p) => !p.completed);

    const inactiveTips = (app.chain as Substrate).tips.store
      .getAll()
      .filter((p) => p.completed);

    const activeTipContent = activeTips.length ? (
      activeTips.map((tip) => (
        <ProposalCard
          proposal={tip}
          injectedContent={<TipDetail proposal={tip} />}
        />
      ))
    ) : (
      <div class="no-proposals">None</div>
    );

    const inactiveTipContent = inactiveTips.length ? (
      inactiveTips.map((tip) => (
        <ProposalCard
          proposal={tip}
          injectedContent={<TipDetail proposal={tip} />}
        />
      ))
    ) : (
      <div class="no-proposals">None</div>
    );

    return (
      <Sublayout
        title={<BreadcrumbsTitleTag title="Tips" />}
        showNewProposalButton
      >
        <div class="TipsPage">
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
                  app.chain &&
                  formatCoin((app.chain as Substrate).treasury.pot),
              },
            ]}
            statAction={
              activeAccount && (
                <CWButton
                  onclick={() =>
                    navigateToSubpage('/new/proposal/:type', {
                      type: ProposalType.SubstrateTreasuryTip,
                    })
                  }
                  label="New tip"
                />
              )
            }
          />
          <CardsCollection content={activeTipContent} header="Active Tips" />
          <CardsCollection
            content={inactiveTipContent}
            header="Inactive Tips"
          />
        </div>
      </Sublayout>
    );
  }
}

export default TipsPage;
