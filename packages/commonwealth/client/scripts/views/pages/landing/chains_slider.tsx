/* @jsx m */

import ClassComponent from 'class_component';
import m from 'mithril';

import 'pages/landing/chains_slider.scss';

import { Chain } from './index';

const initialSlides = 4;

const chainToTag = (chain, index: number) => {
  return (
    <li
      id={`card_${index}`}
      class="glide__slide mt-4 pb-8"
      onclick={(e) => {
        e.preventDefault();
        m.route.set(`/${chain.id}`);
        localStorage['home-scrollY'] = window.scrollY;
      }}
    >
      <div class="bg-white shadow-xl p-5 xl:p-10 rounded-xl text-center h-56 grow">
        <img class="mx-auto mb-3 w-12 h-auto" src={chain.img} alt="" />
        <h3 class="text-2xl font-extrabold mb-1" style="word-break: break-word">
          {chain.name}
        </h3>
        <p class="text-xl">{chain.description}</p>
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

  oninit(vnode: m.Vnode<TokensChainsComponentAttrs>) {
    this.index = 0;

    this.displayedChains = vnode.attrs.chains
      .slice(0, initialSlides)
      .map(chainToTag);

    this.oncreateSlider = vnode.attrs.oncreateSlider;
  }

  oncreate(vnode: m.Vnode<TokensChainsComponentAttrs>) {
    const glide = this.oncreateSlider();

    glide.on('run.before', () => {
      m.redraw();
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
      <section class="bg-geometric-pattern bg-cover bg-full pt-20 pb-40 md:pb-48 mb-48 relative">
        <div class="container mx-auto">
          <h2 class="text-3xl text-left font-extrabold mb-5 text-center">
            Every token, every chain
          </h2>
          <p class="text-left max-w-screen-md mx-auto text-2xl text-center">
            Subscribe to chain activity like whale transfers or major votes.
            Discuss new ideas, crowdfund projects, and access native governance
            for Layer 1s, tokens, and NFTs alike.
          </p>
        </div>
        <div class="absolute bottom-0 left-0 right-0 transform translate-y-1/2">
          <div class="glide">
            <div class="glide__track" data-glide-el="track">
              <ul class="glide__slides">{...this.displayedChains}</ul>
            </div>
          </div>
        </div>
      </section>
    );
  }
}
