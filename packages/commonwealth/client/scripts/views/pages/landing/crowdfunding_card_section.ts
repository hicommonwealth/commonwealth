import 'pages/landing/crowdfunding_card_section.scss';

import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component } from 'mithrilInterop';

import { ICardListItem } from 'models/interfaces';

import LandingPageButton from './landing_page_button';
import ItemListsMapper from './list_mapper_with_item';

const ChainsCrowdfundingComponent: Component<{ chains: ICardListItem[] }, {}> = {
  view: (vnode) => {
    const { chains } = vnode.attrs;

    return render(
      'section.ChainsCrowdfunding',
      { class: 'mx-auto pt-20 container ' },
      [
        render('img', {
          class: 'mx-auto mb-3 w-32 h-32',
          src: 'static/img/misc.png',
          alt: '',
        }),
        render(
          'h2',
          { class: 'text-3xl font-bold mb-5 text-center mb-10' },
          ' Leverage on-chain crowdfunding '
        ),
        // render(
        //   'div.ChainsCrowdfundingButton',
        //   { class: 'flex justify-center text-center' },
        //   render(LandingPageButton, {
        //     href: '',
        //     text: 'Learn more about crowdfunding',
        //   })
        // ),
        render(ItemListsMapper, {
          bgColor: 'bg-white',
          margin: 'mt-20',
          cardItems: chains,
          tabHoverColorClick: 'bg-gray-300',
          textType: 'black',
          variant: 'ChainsCrowsfundingTextList'
        }),
      ]
    );
  },
};

export default ChainsCrowdfundingComponent;
