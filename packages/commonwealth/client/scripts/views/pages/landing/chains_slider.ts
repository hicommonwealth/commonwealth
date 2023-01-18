/* eslint-disable @typescript-eslint/ban-types */

import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';
import 'pages/landing/chains_slider.scss';
import { Chain } from './index';

interface IState {
  chains: Chain[];
  oncreateSlider: Function;
}

const initialSlides = 4;

const chainToTag = (chain, index: number) => {
  return render(
    'li',
    {
      id: `card_${index}`,
      class: 'glide__slide mt-4 pb-8',

      onClick: (e) => {
        e.preventDefault();
        setRoute(`/${chain.id}`);
        localStorage['home-scrollY'] = window.scrollY;
      },
    },
    render(
      'div',
      {
        class:
          'bg-white shadow-xl p-5 xl:p-10 rounded-xl text-center h-56 grow',
      },
      [
        render('img', {
          class: 'mx-auto mb-3 w-12 h-auto',
          src: chain.img,
          alt: '',
        }),
        render(
          'h3',
          {
            class: 'text-2xl font-extrabold mb-1',
            style: 'word-break: break-word'
          },
          chain.name
        ),
        render('p', { class: 'text-xl' }, chain.description),
      ]
    )
  );
};

/* @FIXME STATE NEEDS TO GO */
const TokensChainsComponent: Component<IState, IState & { displayedChains, index: number }> = {
  oninit: (vnode) => {
    vnode.state.index = 0;
    vnode.state.displayedChains = vnode.attrs.chains.slice(0, initialSlides).map(chainToTag);
    vnode.state.oncreateSlider = vnode.attrs.oncreateSlider;
  },
  oncreate: (vnode) => {
    const glide = vnode.state.oncreateSlider();

    glide.on('run.before', () => {
      redraw();
      vnode.state.index++;
    });

    glide.on('run.after', () => {
      vnode.state.displayedChains.push(
        chainToTag(vnode.attrs.chains[vnode.state.index + initialSlides], vnode.state.index + initialSlides - 1)
      );
      glide.update();
    });

    glide.mount();
  },
  view: (vnode) => {
    return render(
      'section.TokensChainsComponent',
      {
        class:
          'bg-geometric-pattern bg-cover bg-full pt-20 pb-40 md:pb-48 mb-48 relative',
      },
      [
        render('div', { class: 'container mx-auto' }, [
          render(
            'h2',
            {
              class: 'text-3xl text-left font-extrabold mb-5 text-center',
            },
            ' Every token, every chain '
          ),
          render(
            'p',
            {
              class:
                'text-left max-w-screen-md mx-auto text-2xl text-center',
            },
            ' Subscribe to chain activity like whale transfers or major votes. Discuss new ideas, crowdfund projects, and access native governance for Layer 1s, tokens, and NFTs alike. '
          ),
        ]),
        render(
          'div',
          {
            class: 'absolute bottom-0 left-0 right-0 transform translate-y-1/2',
          },
          render(
            'div',
            { class: 'glide' },
            render(
              'div',
              { class: 'glide__track', 'data-glide-el': 'track' },
              render('ul', { class: 'glide__slides' }, [
                ...vnode.state.displayedChains,
              ])
            )
          )
        ),
      ]
    );
  },
};

export default TokensChainsComponent;
