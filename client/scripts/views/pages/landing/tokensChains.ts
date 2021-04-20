import m from 'mithril';
import Glide from '@glidejs/glide';

const TokensChainsComponent: m.Component<{}, {}> = {
  oncreate: (vnode) => {
    const glide = new (Glide as any)('.glide', {
      type: 'carousel',
      focusAt: 'center',
      perView: 3,
      gap: 40,
      autoplay: 0,
      hoverpause: true,
      peek: {
        before: 100,
        after: 100,
      },
      breakpoints: {
        1024: {
          perView: 2,
          gap: 40,
        },
        768: {
          perView: 2,
          gap: 20,
        },
        640: {
          perView: 1,
          gap: 16,
          peek: {
            before: 50,
            after: 50,
          },
        },
      },
    });
    glide.mount();
  },
  view: (vnode) => {
    const chainsAllowed = [
      {
        img: 'static/img/near-protocol.png',
        title: 'NEAR Protocol',
        content: ' High-performance platform for dapps with foccus on UX ',
      },
      {
        img: 'static/img/edgeware.svg',
        title: 'Edgeware',
        content: ' Next generation smart contracts ',
      },
      {
        img: 'static/img/straightedge.svg',
        title: 'Straightedge',
        content: ' A Cosmic smart contracting platform ',
      },
    ];

    return m(
      'section',
      {
        class:
          'bg-geometric-pattern bg-cover bg-full pt-20 pb-40 md:pb-48 mb-40 relative',
      },
      [
        m('div', { class: 'container mx-auto' }, [
          m(
            'h2',
            {
              class: 'text-3xl text-left font-extrabold mb-5 md:text-center',
            },
            ' Every Token. Every Chain. '
          ),
          m(
            'p',
            {
              class:
                'text-left max-w-screen-md mx-auto text-2xl md:text-center',
            },
            ' With Commonwealth, any token holder can drive their community. Subscribe to chain activity like whale transfers or new votes, discuss new ideas, crowdfund community projects, and access native governance for Layer 1s and NFTs alike. '
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
                chainsAllowed.map(
                  (chain: { img: string; title: string; content: string }) => {
                    return m(
                      'li',
                      { class: 'glide__slide  h-48' },
                      m(
                        'div',
                        {
                          class:
                            'bg-white rounded shadow-xl p-5 xl:p-10 text-center',
                        },
                        [
                          m('img', {
                            class: 'mx-auto mb-3 w-12 h-auto',
                            src: chain.img,
                            alt: '',
                          }),
                          m(
                            'h3',
                            { class: 'text-2xl font-extrabold mb-1' },
                            chain.title
                          ),
                          m('p', { class: 'text-xl' }, chain.content),
                        ]
                      )
                    );
                  }
                ),
              ])
            )
          )
        ),
      ]
    );
  },
};

export default TokensChainsComponent;
