import 'pages/landing/creators_card_section.scss';

import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component } from 'mithrilInterop';

import { ICardListItem } from 'models/interfaces';

import LandingPageButton from './landing_page_button';
import ItemListsMapper from './list_mapper_with_item';

const TokensCreatorComponent: Component<{ creators: ICardListItem[] }, {}> = {
  view: (vnode) => {
    const { creators } = vnode.attrs;

    return render('section.TokensCreatorComponent', { class: 'container mx-auto pt-10' }, [
      render(
        'h2',
        { class: 'text-3xl font-bold mb-5 text-center' },
        ' Token creators are empowered '
      ),
      render(
        'p',
        { class: 'text-2xl max-w-screen-sm mx-auto text-center mb-10' },
        ' Commonwealth lets you simplify your community and governance, bringing four tools into one. '
      ),
      // render(
      //   'div.TokensCreatorsUseCaseButton',
      //   { class: 'text-center hidden lg:block xl:block mb-20' },
      //   render(LandingPageButton, { href: '', text: 'See use cases' })
      // ),
      render(ItemListsMapper, {
        bgColor: 'bg-gray-900',
        margin: 'mt-4',
        cardItems: creators,
        tabHoverColorClick: 'bg-gray-500',
        variant: 'TokensCreatorsText'
      }),
    ]);
  },
};

export default TokensCreatorComponent;
