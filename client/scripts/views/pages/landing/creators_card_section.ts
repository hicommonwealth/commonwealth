import 'pages/landing/creators_card_section.scss';
import m from 'mithril';

import { ICardListItem } from 'models/interfaces';

import LandingPageButton from './landing_page_button';
import ItemListsMapper from './list_mapper_with_item';

const TokensCreatorComponent: m.Component<{ creators: ICardListItem[] }, {}> = {
  view: (vnode) => {
    const { creators } = vnode.attrs;

    return m('section.TokensCreatorComponent', { class: 'container mx-auto pt-10' }, [
      m(
        'h2',
        { class: 'text-3xl font-bold mb-5 text-center' },
        ' Token creators are empowered '
      ),
      m(
        'p',
        { class: 'text-2xl max-w-screen-sm mx-auto text-center mb-10' },
        ' Commonwealth lets you simplify your community and governance. We bring four tools into one. '
      ),
      // m(
      //   'div.TokensCreatorsUseCaseButton',
      //   { class: 'text-center hidden lg:block xl:block mb-20' },
      //   m(LandingPageButton, { href: '', text: 'See use cases' })
      // ),
      m(ItemListsMapper, {
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
