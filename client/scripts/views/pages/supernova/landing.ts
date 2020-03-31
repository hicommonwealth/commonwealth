import 'pages/supernova/landing.scss';

import { default as m } from 'mithril';
import { default as $ } from 'jquery';
import { default as mixpanel } from 'mixpanel-browser';
import { default as moment } from 'moment-twitter';
import Countdown from 'views/components/countdown';

import app from 'state';

import { formatNumberLong, link } from 'helpers';
import ObjectPage from 'views/pages/_object_page';

const supernovaStart = null; //moment('2019-12-01 00:00');
const supernovaEnd = null; //moment('2020-06-30 23:59');

const SupernovaLandingPage : m.Component<{}, { globalStats }> = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', {
      'Page Name': 'Supernova Landing Page',
    });
    setTimeout(() => {
      vnode.state.globalStats = {
        ethLocked: 0,
        btcLocked: 0,
        atomLocked: 0,
      };
      m.redraw();
    }, 1000);
  },
  view: (vnode) => {
    const globalStats = vnode.state.globalStats;

    return m(ObjectPage, {
      class: 'SupernovaLandingPage',
      content: [
        m('.forum-container', [
          m('.supernova-cover', [
            m('img.supernova-title', {
              src: '/static/img/supernova/sn-wordmark-white.svg',
              title: 'Supernova'
            }, 'Supernova'),
          ]),
          m('.row', [
            m('.col-sm-7.supernova-lead-text', [
              m('p', [
                'Supernova is a Cosmos Zone that allows any project to build an engaged community from day one.',
              ]),
              m('p', [
                'On Supernova, any project can perform a decentralized lockdrop. ',
                'Anyone interested in the project can participate in the lockdrop using Supernova tokens. ',
                'And anyone with an economic stake in the blockchain ecosystem can obtain Supernova tokens.',
              ]),
              m('p', [
                'To launch the network, we\'re beginning by distributing 30% of Supernova tokens to BTC, ETH, ',
                'and ATOM holders in a six-month lockdrop.'
              ]),
              m('.row.row-narrow.lock-actions', [
                m('.col-sm-4', [
                  link('a.btn.formular-button-secondary.supernova-button-primary', '/supernova/lockdrop/btc',
                       'Lock BTC'),
                ]),
                m('.col-sm-4', [
                  link('a.btn.formular-button-secondary.supernova-button-primary', '/supernova/lockdrop/eth',
                       'Lock ETH'),
                ]),
                m('.col-sm-4', [
                  link('a.btn.formular-button-secondary.supernova-button-primary', '/supernova/lockdrop/atom',
                       'Lock ATOM'),
                ]),
              ]),
              m('.row.row-narrow', [
                m('.col-sm-8', [
                  link('a.btn.formular-button-secondary.supernova-button-secondary', '/supernova/keygen',
                       'Generate Supernova address'),
                ]),
              ]),
              m('.row.row-narrow', [
                m('.col-sm-8', [
                  link('a.btn.formular-button-secondary.supernova-button-secondary', '/supernova/lookup',
                       'Check lock status'),
                ]),
              ]),
            ]),
            m('.col-sm-5.supernova-lead-actions', [

              // progress
              m('.progress-section', [
                m('.section-heading', 'Progress'),
                m('.progress-bar', [
                  m('.progress-bar-content', { style: 'width: 0%;' }),
                ]),
                m('.progress-text', [

                  m('.progress-text-item', supernovaEnd ? [
                    m('.progress-text-left', [
                      m(Countdown, { time: supernovaEnd }),
                      ' remaining',
                    ]),
                    m('.progress-text-right', '0% complete'),
                  ] : [
                    m('.progress-text-left', 'Lockdrop will launch Q1 2020. Stay tuned!'),
                  ]),
                ]),
              ]),

              // stats
              m('.stats-section', [
                m('.section-heading', 'Stats'),
                m('.lock-total', [
                  m('h2.lock-stat', !globalStats ? m('span.icon-spinner1.animate-spin') : [
                    m('img.coin-icon', { src: '/static/img/protocols/btc.png' }),
                    formatNumberLong(globalStats.btcLocked),
                    ' BTC locked',
                  ]),
                ]),
                m('.lock-total', [
                  m('h2.lock-stat', !globalStats ? m('span.icon-spinner1.animate-spin') : [
                    m('img.coin-icon', { src: '/static/img/protocols/eth.png' }),
                    formatNumberLong(globalStats.ethLocked),
                    ' ETH locked',
                  ]),
                ]),
                m('.lock-total', [
                  m('h2.lock-stat', !globalStats ? m('span.icon-spinner1.animate-spin') : [
                    m('img.coin-icon', { src: '/static/img/protocols/atom.png' }),
                    formatNumberLong(globalStats.atomLocked),
                    ' ATOM locked',
                  ]),
                ]),
              ]),

              // info
              m('.info-section', [
                m('.section-heading', 'Info'),
                m('.info-item', [
                  m('.info-label', 'Lockdrop start'),
                  m('.info-value', supernovaStart ? supernovaStart.format('ddd, MMM D YYYY H:mm') : 'To be announced'),
                ]),
                m('.info-item', [
                  m('.info-label', 'Lockdrop end'),
                  m('.info-value', supernovaEnd ? supernovaEnd.format('ddd, MMM D YYYY H:mm') : 'To be announced'),
                ]),
                m('.info-item', [
                  m('.info-label', 'Total DUST issued'),
                  m('.info-value', '21,000,000'),
                ]),
                m('.info-item', [
                  m('.info-label', 'Issued in lockdrop'),
                  m('.info-value', '30%'),
                ]),
              ]),
            ]),
          ]),
          m('br'),
        ]),
      ],
    });
  }
};

export default SupernovaLandingPage;
