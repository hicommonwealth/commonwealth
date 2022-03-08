import 'pages/landing/crowdfunding_card_section.scss';
import m from 'mithril';

import { ICardListItem } from 'models/interfaces';

import LandingPageButton from './landing_page_button';
import ItemListsMapper from './list_mapper_with_item';

const ChainsCrowdfundingComponent: m.Component<
  { chains: ICardListItem[] },
  {}
> = {
  view: (vnode) => {
    const { chains } = vnode.attrs;

    return m(
      'section.ChainsCrowdfunding',
      { class: 'mx-auto pt-20 container ' },
      [
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
        // m(
        //   'div.ChainsCrowdfundingButton',
        //   { class: 'flex justify-center text-center' },
        //   m(LandingPageButton, {
        //     href: '',
        //     text: 'Learn more about crowdfunding',
        //   })
        // ),
        m(ItemListsMapper, {
          bgColor: 'bg-white',
          margin: 'mt-20',
          cardItems: chains,
          tabHoverColorClick: 'bg-gray-300',
          textType: 'black',
          variant: 'ChainsCrowsfundingTextList',
        }),
      ]
    );
  },
};

export default ChainsCrowdfundingComponent;
