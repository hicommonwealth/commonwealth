/* @jsx jsx */

import React from 'react';

import type { ResultNode } from 'mithrilInterop';
import { ClassComponent, setRoute, redraw, jsx } from 'mithrilInterop';

import 'pages/landing/chains_slider.scss';

import { Chain } from './index';

const initialSlides = 4;

const chainToTag = (chain, index: number) => {
  return (
    <li
      id={`card_${index}`}
      className="glide__slide mt-4 pb-8"
      onClick={(e) => {
        e.preventDefault();
        // TODO this setRoute is not related to react-router => won't work
        setRoute(`/${chain.id}`);
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

type TokensChainsComponentAttrs = {
  chains: Array<Chain>;
  oncreateSlider: () => any;
};

export class TokensChainsComponent extends ClassComponent<TokensChainsComponentAttrs> {
  private displayedChains;
  private index: number;
  private oncreateSlider: () => any;

  oncreate(vnode: ResultNode<TokensChainsComponentAttrs>) {
    this.index = 0;

    this.displayedChains = vnode.attrs.chains
      .slice(0, initialSlides)
      .map(chainToTag);

    this.oncreateSlider = vnode.attrs.oncreateSlider;

    const glide = this.oncreateSlider();

    glide.on('run.before', () => {
      redraw();
      this.index++;
    });

    glide.on('run.after', () => {
      this.displayedChains.push(
        chainToTag(
          vnode.attrs.chains[this.index + initialSlides],
          this.index + initialSlides - 1
        )
      );

      glide.update();
    });

    glide.mount();
  }

  view() {
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
              <ul className="glide__slides">{...this.displayedChains}</ul>
            </div>
          </div>
        </div>
      </section>
    );
  }
}
