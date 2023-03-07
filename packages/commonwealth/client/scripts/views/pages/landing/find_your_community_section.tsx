import React from 'react';

import 'pages/landing/find_your_community_section.scss';

type Holder = {
  alt: string;
  img: string;
  text: string;
  title: string;
};

type TokenHoldersComponentProps = {
  holders: Array<Holder>;
};

export const TokenHoldersComponent = (props: TokenHoldersComponentProps) => {
  const { holders } = props;

  return (
    <section className="LandingPageTokenHolders container mx-auto pt-20">
      <h2 className="text-3xl font-bold mb-5 text-center">
        Token holders come together
      </h2>
      <p className="text-2xl max-w-screen-sm mx-auto text-center mb-10">
        Find your community and drive your token forward.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
        {holders.map((holder, i) => {
          return (
            <div className="text-center lg:text-left" key={i}>
              <img
                className="w-28 h-28 mx-auto lg:mx-0"
                src={holder.img}
                alt={holder.alt}
              />
              <h3 className="mt-4 text-2xl font-bold mb-1">{holder.title}</h3>
              <p className="text-lg">{holder.text}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
