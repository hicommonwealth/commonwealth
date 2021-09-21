import 'pages/landing/crowdfunding_card_section.scss';
import m from 'mithril';

import { ICardListItem } from 'models/interfaces';

const ChainsCrowdfundingComponent: m.Component<{ chains: ICardListItem[] }, {}> = {
  view: (vnode) => {
    const { chains } = vnode.attrs;

    return m('section.ChainsCrowdfunding', [
      m('img', {
        class: 'mx-auto mb-3 w-32 h-32',
        src: 'static/img/misc.png',
        alt: '',
      }),
      m(
        'h2',
        { class: 'text-3xl font-bold mb-5 text-center mb-10' },
        ' Leverage on-chain crowdfunding '
      ),
      m('div', { class: 'CrowdfundingContainer' }, [
        m('div', { class: 'CrowdfundingCarouselCarbon' }, [
          m('div', { class: 'CrowdfundingCarouselCarbonImgContainer' }, [
            m('img', {
              class: 'CrowdfundingImg',
              src: 'static/img/carousel-carbon.svg',
              alt: 'Carousel carbon',
            }),
            m('div', { class: 'CrowdfundingBackground' }),
          ]),

          m('div', { class: 'CrowdfundingTextContainer' }, [
            m(
              'h3',
              {
                class: 'CrowdfundingCarouselTitle',
              },
              'Fund new projects'
            ),
            m(
              'p',
              {
                class: 'CrowdfundingCarouselText',
              },
              // eslint-disable-next-line max-len
              'Anyone from within your community can easily turn a conversation thread into a Kickstarter-like campaign.'
            ),
          ]),
        ]),

        m('div', { class: 'CrowdfundingCarouselCarbon' }, [
          m('div', { class: 'CrowdfundingCarouselCarbonImgContainer' }, [
            m('img', {
              class: 'CrowdfundingAlterImg',
              src: 'static/img/carousel-collective.svg',
              alt: 'Carousel collective',
            }),
            m('div', { class: 'CrowdfundingBackground' }),
          ]),
          m('div', { class: 'CrowdfundingTextContainer' }, [
            m(
              'h3',
              {
                class: 'CrowdfundingCarouselTitle',
              },
              'Create Community Endowments'
            ),
            m(
              'p',
              {
                class: 'CrowdfundingCarouselText',
              },
              // eslint-disable-next-line max-len
              'Pool funds with other like-minded folks, and fund interesting projects within your community or across the web.'
            ),
          ]),
        ]),

        m('div', { class: 'CrowdfundingCustomCarousel pb-20' }, [
          m('div', { class: 'CrowdfundingCarouselCarbonImgContainer' }, [
            m('img', {
              class: 'CrowdfundingImg',
              src: 'static/img/carousel-token.svg',
              alt: 'Carousel discussion token',
            }),
            m('div', { class: 'CrowdfundingBackground' }),
          ]),
          m('div', { class: 'CrowdfundingTextContainer' }, [
            m(
              'h3',
              {
                class: 'CrowdfundingCarouselTitle',
              },
              'Launch New Tokens'
            ),
            m(
              'p',
              {
                class: 'CrowdfundingCarouselText',
              },
              // eslint-disable-next-line max-len
              'Use a project to raise funds for a new DeFi token or NFT. Optionally plug in an allowlist for KYC compliance. '
            ),
          ]),
        ]),
      ]),
    ]);
  },
};

export default ChainsCrowdfundingComponent;
