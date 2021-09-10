import 'pages/landing/creators_card_section.scss';
import m from 'mithril';

import { ICardListItem } from 'models/interfaces';

import LandingPageButton from './landing_page_button';
import ItemListsMapper from './list_mapper_with_item';

const TokensCreatorComponent: m.Component<{ creators: ICardListItem[] }, {}> = {
  view: (vnode) => {
    const { creators } = vnode.attrs;

    return m('section.TokensCreatorComponent', { class: '' }, [
      m('div', { class: 'container mx-auto pt-10' }, [
        m(
          'h2',
          { class: 'text-3xl font-bold mb-5 text-center' },
          ' Token creators are empowered '
        ),
        m(
          'p',
          { class: 'text-2xl max-w-screen-sm mx-auto text-center mb-10' },
          ' Commonwealth lets you simplify your community and governance, bringing four tools into one. '
        ),
      ]),

      // m(
      //   'div.TokensCreatorsUseCaseButton',
      //   { class: 'text-center hidden lg:block xl:block mb-20' },
      //   m(LandingPageButton, { href: '', text: 'See use cases' })
      // ),
      m('div', { class: 'TokensCreatorsContentContainer' }, [
        m('div', { class: 'TokenCarouselDiscussion' }, [
          m('div', { class: 'TokenCarouselDiscussionImgContainer' }, [
            m('img', {
              class: 'TokenCarouselImg',
              src: 'static/img/carousel-discussion-sm.svg',
              alt: 'Carousel discussion sm',
            }),
          ]),
          m('div', { class: 'TokenCarouselTextContainer' }, [
            m(
              'h3',
              {
                class: 'TokenCarouselTitle',
              },
              'On-chain notifications'
            ),
            m(
              'p',
              {
                class: 'TokenCarouselText',
              },
              'Stay up-to-date on chain events like votes and large transfers.'
            ),
          ]),
        ]),

        m('div', { class: 'TokenCarouselDiscussion' }, [
          m('div', { class: 'TokenCarouselDiscussionImgContainer' }, [
            m('img', {
              class: 'TokenCarouselImg',
              src: 'static/img/carousel-polling-sm.svg',
              alt: 'Carousel polling sm',
            }),
          ]),
          m('div', { class: 'TokenCarouselTextContainer' }, [
            m(
              'h3',
              {
                class: 'TokenCarouselTitle',
              },
              'Off-chain polling & on-chain voting'
            ),
            m(
              'p',
              {
                class: 'TokenCarouselText',
              },
              // eslint-disable-next-line max-len
              'Whether you use Snapshot, COMP governance contracts, or native Layer 1 voting, access everything from one place.'
            ),
          ]),
        ]),

        m('div', { class: 'TokenCarouselDiscussion' }, [
          m('div', { class: 'TokenCarouselDiscussionImgContainer' }, [
            m('img', {
              class: 'TokenCarouselImg',
              src: 'static/img/carousel-discussion-poll-sm.svg',
              alt: 'Carousel discussion polling sm',
            }),
          ]),
          m('div', { class: 'TokenCarouselTextContainer' }, [
            m(
              'h3',
              {
                class: 'TokenCarouselTitle',
              },
              'Crowdfunding'
            ),
            m(
              'p',
              {
                class: 'TokenCarouselText',
              },
              'Fund new tokens and community initiatives with Kickstarter-like raises from a thread. '
            ),
          ]),
        ]),

        m('div', { class: 'TokenCarouselDiscussionLast' }, [
          m('div', { class: 'TokenCarouselDiscussionImgContainer' }, [
            m('img', {
              class: 'TokenCarouselImg',
              src: 'static/img/carousel-forum-sm.svg',
              alt: 'Carousel discussion polling sm',
            }),
          ]),
          m('div', { class: 'TokenCarouselTextContainer' }, [
            m(
              'h3',
              {
                class: 'TokenCarouselTitle',
              },
              'A rich forum experience'
            ),
            m(
              'p',
              {
                class: 'TokenCarouselText',
              },
              // eslint-disable-next-line max-len
              'Discuss memes or key decisions, in a Discourse-style forum. Enhance your posts with built in Markdown and fun reactions.'
            ),
          ]),
        ]),
      ]),
      // m(ItemListsMapper, {
      //   bgColor: 'bg-gray-900',
      //   margin: 'mt-4',
      //   cardItems: creators,
      //   tabHoverColorClick: 'bg-gray-500',
      //   variant: 'TokensCreatorsText'
      // }),
    ]);
  },
};

export default TokensCreatorComponent;
