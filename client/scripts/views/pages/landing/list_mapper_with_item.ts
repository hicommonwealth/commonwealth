import m from 'mithril';

import { removeOrAddClasslistToAllElements } from 'helpers';
import { ICardListItem } from 'models/interfaces';

import ListedCardWithImage from './listed_card_with_image';
import ListContainer from './list_container';

const ItemListsMapper: m.Component<
  {
    cardItems: ICardListItem[];
    textType?: string;
    tabHoverColorClick?: string;
    bgColor: string;
    margin: string;
    variant?: string;
  },
  { buttonHoverActiveById: string; cardImageActiveById: string }
> = {
  oninit: (vnode) => {
    const { cardItems } = vnode.attrs;
    vnode.state.buttonHoverActiveById = cardItems[0].button.id;
    vnode.state.cardImageActiveById = cardItems[0].card.id;
  },
  view: (vnode) => {
    const { cardItems, tabHoverColorClick, textType, bgColor, margin, variant } = vnode.attrs;
    const { buttonHoverActiveById, cardImageActiveById } = vnode.state;

    const handleClickItem = (cardItem: ICardListItem) => {
      const { button, card } = cardItem;
      removeOrAddClasslistToAllElements(cardItems, 'block', 'remove');
      removeOrAddClasslistToAllElements(cardItems, 'invisible', 'remove');
      removeOrAddClasslistToAllElements(
        cardItems.filter((itemToFilter) => itemToFilter !== cardItem),
        'invisible',
        'add'
      );

      document.getElementById(button.id).classList.add(tabHoverColorClick);
      document.getElementById(card.id).classList.add('block');
      vnode.state.buttonHoverActiveById = button.id;
      vnode.state.cardImageActiveById = card.id;
    };

    const mappedListItems = cardItems.map((item: ICardListItem) => {
      const { button, card, texts } = item;
      // eslint-disable-next-line no-return-assign
      return m(ListedCardWithImage, {
        handleClick: () => handleClickItem(item),
        isTabHoverActive: buttonHoverActiveById === button.id,
        title: texts.title,
        subtitle: texts.text,
        buttonId: button.id,
        cardId: card.id,
        imageActive: cardImageActiveById === card.id,
        imageSrc: card.imgSrc,
        imageAlt: card.imgAlt,
        tabHoverColorClick,
        textType,
        variant
      });
    });

    return m(
      ListContainer,
      {
        bgColor,
        margin,
      },
      mappedListItems
    );
  },
};

export default ItemListsMapper;
