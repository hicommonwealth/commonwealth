import React, { useState } from 'react';

import type { ICardListItem } from 'models/interfaces';

import { removeOrAddClasslistToAllElements } from 'helpers';
import { ListedCardWithImage } from './listed_card_with_image';

type ListMapperWithItemProps = {
  bgColor: string;
  cardItems: Array<ICardListItem>;
  margin: string;
  tabHoverColorClick?: string;
  textType?: string;
  variant?: string;
};

export const ListMapperWithItem = ({
  bgColor,
  cardItems,
  margin,
  tabHoverColorClick,
  textType,
  variant,
}: ListMapperWithItemProps) => {
  const [buttonHoverActiveById, setButtonHoverActiveById] = useState<string>(
    cardItems[0].button.id
  );
  const [cardImageActiveById, setCardImageActiveById] = useState<string>(
    cardItems[0].card.id
  );

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
    setButtonHoverActiveById(button.id);
    setCardImageActiveById(card.id);
  };

  const mappedListItems = cardItems.map((item: ICardListItem, i) => {
    const { button, card, texts } = item;

    // eslint-disable-next-line no-return-assign
    return (
      <ListedCardWithImage
        key={i}
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
    <ul
      className={`rounded-3xl p-3 lg:p-6 relative min-h-tabs lg:flex
           lg:flex-col lg:h-full ${bgColor} ${margin}`}
    >
      {mappedListItems}
    </ul>
  );
};
