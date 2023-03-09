import React from 'react';

import 'pages/landing/crowdfunding_card_section.scss';

import type { ICardListItem } from 'models/interfaces';
import { ItemListsMapper } from './list_mapper_with_item';

type ChainsCrowdfundingComponentProps = { chains: ICardListItem[] };

export const ChainsCrowdfundingComponent = (
  props: ChainsCrowdfundingComponentProps
) => {
  const { chains } = props;

  return (
    <section className="ChainsCrowdfunding mx-auto pt-20 container">
      <img
        className="mx-auto mb-3 w-32 h-32"
        src="static/img/misc.png"
        alt=""
      />
      <h2 className="text-3xl font-bold mb-5 text-center mb-10">
        Leverage on-chain crowdfunding
      </h2>
      <ItemListsMapper
        bgColor="bg-white"
        margin="mt-20"
        cardItems={chains}
        tabHoverColorClick="bg-gray-300"
        textType="black"
        variant="ChainsCrowsfundingTextList"
      />
    </section>
  );
};
