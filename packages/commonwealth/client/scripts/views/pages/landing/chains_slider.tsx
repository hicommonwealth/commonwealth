import React from 'react';

import 'pages/landing/chains_slider.scss';

import type { Chain } from './index';
import { useCommonNavigate } from 'navigation/helpers';

const initialSlides = 4;

type TokensChainsComponentAttrs = {
  chains: Array<Chain>;
  oncreateSlider: () => any;
};

export const TokensChainsComponent = (props: TokensChainsComponentAttrs) => {
  const { chains, oncreateSlider } = props;

  const navigate = useCommonNavigate();

  const chainToTag = (chain, index: number) => {
    return (
      <li
        id={`card_${index}`}
        className="glide__slide mt-4 pb-8"
        onClick={(e) => {
          e.preventDefault();
          navigate(`/${chain.id}`);
          localStorage['home-scrollY'] = window.scrollY;
        }}
      >
        <div className="bg-white shadow-xl p-5 xl:p-10 rounded-xl text-center h-56 grow">
          <img className="mx-auto mb-3 w-12 h-auto" src={chain.img} alt="" />
          <h3
            className="text-2xl font-extrabold mb-1"
            style={{ wordBreak: 'break-word' }}
          >
            {chain.name}
          </h3>
          <p className="text-xl">{chain.description}</p>
        </div>
      </li>
    );
  };

  const [displayedChains, setDisplayedChains] = React.useState<any>(
    chains
      .slice(0, initialSlides)
      .map((chain, index) => chainToTag(chain, index))
  );
  const [index, setIndex] = React.useState<number>(0);

  //   const glide = oncreateSlider();

  //   glide.on('run.before', () => {
  //     redraw();
  //     index++;
  //   });

  //   glide.on('run.after', () => {
  //     displayedChains.push(
  //       chainToTag(
  //         chains[index + initialSlides],
  //         index + initialSlides - 1,
  //         setRoute
  //       )
  //     );

  //     glide.update();
  //   });

  //   glide.mount();
  // }

  return (
    <section className="bg-geometric-pattern bg-cover bg-full pt-20 pb-40 md:pb-48 mb-48 relative">
      <div className="container mx-auto">
        <h2 className="text-3xl text-left font-extrabold mb-5 text-center">
          Every token, every chain
        </h2>
        <p className="text-left max-w-screen-md mx-auto text-2xl text-center">
          Subscribe to chain activity like whale transfers or major votes.
          Discuss new ideas, crowdfund projects, and access native governance
          for Layer 1s, tokens, and NFTs alike.
        </p>
      </div>
      <div className="absolute bottom-0 left-0 right-0 transform translate-y-1/2">
        <div className="glide">
          <div className="glide__track" data-glide-el="track">
            <ul className="glide__slides">{...displayedChains}</ul>
          </div>
        </div>
      </div>
    </section>
  );
};
