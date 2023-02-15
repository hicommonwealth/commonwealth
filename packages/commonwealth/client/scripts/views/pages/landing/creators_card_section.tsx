import React from 'react';

import 'pages/landing/creators_card_section.scss';

import type { ICardListItem } from 'models/interfaces';
import { ItemListsMapper } from './list_mapper_with_item';

type TokensCreatorComponentProps = {
  creators: Array<ICardListItem>;
};

export const TokensCreatorComponent = (props: TokensCreatorComponentProps) => {
  const { creators } = props;

  return (
    <section className="container mx-auto pt-10">
      <h2 className="text-3xl font-bold mb-5 text-center">
        Token creators are empowered
      </h2>
      <p className="text-2xl max-w-screen-sm mx-auto text-center mb-10">
        Commonwealth lets you simplify your community and governance, bringing
        four tools into one.
      </p>
      <ItemListsMapper
        bgColor="bg-gray-900"
        margin="mt-4"
        cardItems={creators}
        tabHoverColorClick="bg-gray-500"
        variant="TokensCreatorsText"
      />
    </section>
  );
};
