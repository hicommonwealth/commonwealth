/* @jsx m */

import m from 'mithril';
import { Tag } from 'construct-ui';

import 'pages/validators.scss';

import app from 'state';
import { pluralize, externalLink } from 'helpers';
import { ChainBase } from 'types';
import { AddressInfo } from 'models';
import Substrate from 'controllers/chain/substrate/main';
import Sublayout from 'views/sublayout';
import User from 'views/components/widgets/user';
import { PageLoading } from 'views/pages/loading';
import ErrorPage from 'views/pages/error';
import { CWCard } from '../components/component_kit/cw_card';
import { CardsCollection } from '../components/cards_collection';
import { GovExplainer } from '../components/gov_explainer';
import { CWText } from '../components/component_kit/cw_text';

class Validator implements m.ClassComponent<{ info }> {
  view(vnode) {
    if (!vnode.attrs.info) return;

    const { info } = vnode.attrs;

    return (
      <CWCard elevation="elevation-1" className="ValidatorCard">
        <div class="user-and-nominator">
          {m(User, {
            user: new AddressInfo(null, info.stash, info.chain, null),
            popover: true,
            hideIdentityIcon: true,
          })}
          <CWText type="caption" fontWeight="medium">
            {`${info.total?.format(true)} from ${pluralize(
              info.nominators,
              'nominator'
            )}`}
          </CWText>
        </div>
        {info.commission && (
          <CWText
            type="caption"
            className="commission-text"
          >{`${info.commission} commission`}</CWText>
        )}
      </CWCard>
    );
  }
}

class ValidatorsTitle implements m.ClassComponent {
  view() {
    return (
      <>
        Validators
        <Tag
          size="xs"
          label="Beta"
          style="position: relative; top: -2px; margin-left: 6px"
        />
      </>
    );
  }
}

class ValidatorsPage implements m.ClassComponent {
  private validators;
  private totalStaked;
  private validatorsInitialized: boolean;

  view() {
    if (!app.chain || !app.chain.loaded) {
      if (
        app.chain?.base === ChainBase.Substrate &&
        (app.chain as Substrate).chain?.timedOut
      ) {
        return (
          <ErrorPage
            message="Could not connect to chain"
            title={<ValidatorsTitle />}
          />
        );
      }

      return (
        <PageLoading
          message="Connecting to chain"
          title={<ValidatorsTitle />}
          showNewProposalButton
        />
      );
    }

    if (
      app.chain?.base === ChainBase.Substrate &&
      app.chain.apiInitialized &&
      !this.validatorsInitialized
    ) {
      (app.chain as Substrate).accounts.getValidators().then((result) => {
        this.validators = result;

        // calculate total staked
        this.totalStaked = (app.chain as Substrate).chain.coins(0);
        (result as any).forEach((va) => {
          this.totalStaked = (app.chain as Substrate).chain.coins(
            this.totalStaked.asBN.add(va.total.asBN)
          );
        });
      });
      // TODO: handle error fetching vals
      this.validatorsInitialized = true;
      m.redraw();
    }

    const validators = this.validators;

    if (!validators) {
      return (
        <PageLoading
          message="Loading validators"
          title={<ValidatorsTitle />}
          showNewProposalButton
        />
      );
    }

    const sort = 'amount';
    // also: nominators, return

    const validatorCards = (
      sort === 'amount'
        ? validators?.sort((a, b) => b.total?.toString() - a.total?.toString())
        : sort === 'nominators'
        ? validators?.sort((a, b) => b.nominators - a.nominators)
        : validators?.sort((a, b) => b.expectedReturn - a.expectedReturn)
    ).map((info) => <Validator info={info} />);

    return (
      <Sublayout title={<ValidatorsTitle />} showNewProposalButton>
        <div class="ValidatorsPage">
          <GovExplainer
            statHeaders={[
              {
                statName: 'Validators',
                statDescription: `are responsible for producing blocks and securing the network. \
            Nominate validators to receive staking rewards.`,
              },
            ]}
            stats={[
              {
                statHeading: 'Validators:',
                stat: validators?.length,
              },
              {
                statHeading: 'Total Staked:',
                stat: `${this.totalStaked.format(true)} / 
            ${(app.chain as Substrate).chain.totalbalance.format(true)}`,
              },
            ]}
            statAction={
              app.chain?.meta?.node.url &&
              m('.stats-box-action', [
                externalLink(
                  'a',
                  `https://polkadot.js.org/apps/?rpc=${encodeURIComponent(
                    app.chain?.meta?.node.url
                  )}#/staking`,
                  'Nominate on polkadot-js'
                ),
              ])
            }
          />
          <CardsCollection content={validatorCards} header="Validators" />
        </div>
      </Sublayout>
    );
  }
}

export default ValidatorsPage;
