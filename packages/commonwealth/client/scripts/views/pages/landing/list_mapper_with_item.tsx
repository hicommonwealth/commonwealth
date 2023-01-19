/* @jsx jsx */

import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  jsx,
} from 'mithrilInterop';

import { removeOrAddClasslistToAllElements } from 'helpers';
import { ICardListItem } from 'models/interfaces';
import { ListedCardWithImage } from './listed_card_with_image';
import { ListContainer } from './list_container';

type ItemListsMapperAttrs = {
  bgColor: string;
  cardItems: Array<ICardListItem>;
  margin: string;
  tabHoverColorClick?: string;
  textType?: string;
  variant?: string;
};

export class ItemListsMapper extends ClassComponent<ItemListsMapperAttrs> {
  private buttonHoverActiveById: string;
  private cardImageActiveById: string;

  oninit(vnode: ResultNode<ItemListsMapperAttrs>) {
    const { cardItems } = vnode.attrs;

    this.buttonHoverActiveById = cardItems[0].button.id;
    this.cardImageActiveById = cardItems[0].card.id;
  }

  view(vnode) {
    const {
      cardItems,
      tabHoverColorClick,
      textType,
      bgColor,
      margin,
      variant,
    } = vnode.attrs;

    const { buttonHoverActiveById, cardImageActiveById } = this;

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
      this.buttonHoverActiveById = button.id;
      this.cardImageActiveById = card.id;
    };

    const mappedListItems = cardItems.map((item: ICardListItem) => {
      const { button, card, texts } = item;

      // eslint-disable-next-line no-return-assign
      return (
        <ListedCardWithImage
          handleClick={() => handleClickItem(item)}
          isTabHoverActive={buttonHoverActiveById === button.id}
          title={texts.title}
          subtitle={texts.text}
          buttonId={button.id}
          cardId={card.id}
          imageActive={cardImageActiveById === card.id}
          imageSrc={card.imgSrc}
          imageAlt={card.imgAlt}
          tabHoverColorClick={tabHoverColorClick}
          textType={textType}
          variant={variant}
        />
      );
    });

    return (
      <ListContainer bgColor={bgColor} margin={margin}>
        {mappedListItems}
      </ListContainer>
    );
  }
}
