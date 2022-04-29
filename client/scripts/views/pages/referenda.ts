/* eslint-disable @typescript-eslint/ban-types */
import 'pages/referenda.scss';

import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { Tag } from 'construct-ui';

import app from 'state';
import { blockperiodToDuration } from 'helpers';
import { ChainBase } from 'types';

import Substrate from 'controllers/chain/substrate/main';

import Sublayout from 'views/sublayout';
import { PageLoading } from 'views/pages/loading';
import { ProposalCard } from 'views/components/proposal_card/proposal_card';
import { CountdownUntilBlock } from 'views/components/countdown';
import loadSubstrateModules from 'views/components/load_substrate_modules';

import ErrorPage from './error';
import { CardsCollection } from '../components/cards_collection';

const SubstrateProposalStats: m.Component<{}, {}> = {
  view: (vnode) => {
    if (!app.chain) return;

    return m('.stats-box', [
      m('.stats-box-left', '💭'),
      m('.stats-box-right', [
        m('', [
          m('strong', 'Referenda'),
          m('span', [
            ' are final votes to approve/reject treasury proposals, upgrade the chain, or change technical parameters.',
          ]),
        ]),
        m('', [
          m('.stats-box-stat', [
            'Next referendum: ',
            (app.chain as Substrate).democracyProposals.nextLaunchBlock
              ? m(CountdownUntilBlock, {
                  block: (app.chain as Substrate).democracyProposals
                    .nextLaunchBlock,
                  includeSeconds: false,
                })
              : '--',
          ]),
          m('.stats-box-stat', [
            'Passed referenda are enacted after: ',
            (app.chain as Substrate).democracy.enactmentPeriod
              ? blockperiodToDuration(
                  (app.chain as Substrate).democracy.enactmentPeriod
                ).asDays()
              : '--',
            ' days',
          ]),
        ]),
      ]),
    ]);
  },
};

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

const ReferendaPage: m.Component<{}> = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', { 'Page Name': 'ReferendaPage' });
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
  },
  view: (vnode) => {
    if (!app.chain || !app.chain.loaded) {
      if (
        app.chain?.base === ChainBase.Substrate &&
        (app.chain as Substrate).chain?.timedOut
      ) {
        return m(ErrorPage, {
          message: 'Could not connect to chain',
          title: [
            'Referenda',
            m(Tag, {
              size: 'xs',
              label: 'Beta',
              style: 'position: relative; top: -2px; margin-left: 6px',
            }),
          ],
        });
      }
      return m(PageLoading, {
        message: 'Connecting to chain',
        title: [
          'Referenda',
          m(Tag, {
            size: 'xs',
            label: 'Beta',
            style: 'position: relative; top: -2px; margin-left: 6px',
          }),
        ],
        showNewProposalButton: true,
      });
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
    const activeProposalContent = !activeDemocracyReferenda?.length
      ? [m('.no-proposals', 'None')]
      : (activeDemocracyReferenda || []).map((proposal) =>
          m(ProposalCard, { proposal })
        );

    // inactive proposals
    const inactiveDemocracyReferenda =
      onSubstrate &&
      (app.chain as Substrate).democracy.store
        .getAll()
        .filter((p) => p.completed);
    const inactiveProposalContent = !inactiveDemocracyReferenda?.length
      ? [m('.no-proposals', 'None')]
      : (inactiveDemocracyReferenda || []).map((proposal) =>
          m(ProposalCard, { proposal })
        );

    return m(
      Sublayout,
      {
        title: [
          'Referenda',
          m(Tag, {
            size: 'xs',
            label: 'Beta',
            style: 'position: relative; top: -2px; margin-left: 6px',
          }),
        ],
        showNewProposalButton: true,
      },
      m('.ReferendaPage', [
        onSubstrate && m(SubstrateProposalStats),
        m('.clear'),
        m(CardsCollection, {
          content: activeProposalContent,
          header: 'Active Referenda',
        }),
        m('.clear'),
        m(CardsCollection, {
          content: inactiveProposalContent,
          header: 'Inactive Referenda',
        }),
        m('.clear'),
      ])
    );
  },
};

export default ReferendaPage;
