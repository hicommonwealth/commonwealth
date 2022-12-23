/* eslint-disable @typescript-eslint/ban-types */
import m from 'mithril';
import 'pages/landing/chains_slider.scss';
import { Chain } from './index';

interface IState {
  chains: Chain[];
  oncreateSlider: Function;
}

const initialSlides = 4;

const chainToTag = (chain, index: number) => {
  return m(
    'li',
    {
      id: `card_${index}`,
      class: 'glide__slide mt-4 pb-8',

      onclick: (e) => {
        e.preventDefault();
        m.route.set(`/${chain.id}`);
        localStorage['home-scrollY'] = window.scrollY;
      },
    },
    m(
      'div',
      {
        class:
          'bg-white shadow-xl p-5 xl:p-10 rounded-xl text-center h-56 grow',
      },
      [
        m('img', {
          class: 'mx-auto mb-3 w-12 h-auto',
          src: chain.img,
          alt: '',
        }),
        m(
          'h3',
          {
            class: 'text-2xl font-extrabold mb-1',
            style: 'word-break: break-word'
          },
          chain.name
        ),
        m('p', { class: 'text-xl' }, chain.description),
      ]
    )
  );
};

const TokensChainsComponent: m.Component<IState, IState & { displayedChains, index: number }> = {
  oninit: (vnode) => {
    vnode.state.index = 0;
    vnode.state.displayedChains = vnode.attrs.chains.slice(0, initialSlides).map(chainToTag);
    vnode.state.oncreateSlider = vnode.attrs.oncreateSlider;
  },
  oncreate: (vnode) => {
    const glide = vnode.state.oncreateSlider();

    glide.on('run.before', () => {
      m.redraw();
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
    return m(
      'section.TokensChainsComponent',
      {
        class:
          'bg-geometric-pattern bg-cover bg-full pt-20 pb-40 md:pb-48 mb-48 relative',
      },
      [
        m('div', { class: 'container mx-auto' }, [
          m(
            'h2',
            {
              class: 'text-3xl text-left font-extrabold mb-5 text-center',
            },
            ' Every token, every chain '
          ),
          m(
            'p',
            {
              class:
                'text-left max-w-screen-md mx-auto text-2xl text-center',
            },
            ' Subscribe to chain activity like whale transfers or major votes. Discuss new ideas, crowdfund projects, and access native governance for Layer 1s, tokens, and NFTs alike. '
          ),
        ]),
        m(
          'div',
          {
            class: 'absolute bottom-0 left-0 right-0 transform translate-y-1/2',
          },
          m(
            'div',
            { class: 'glide' },
            m(
              'div',
              { class: 'glide__track', 'data-glide-el': 'track' },
              m('ul', { class: 'glide__slides' }, [
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
