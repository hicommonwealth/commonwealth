import m from 'mithril';
import './landing_page_token_holders.scss';

interface IState {
  holders: {
    img: string;
    alt: string;
    title: string;
    text: string;
  }[];
}

const TokenHoldersComponent: m.Component<IState, IState> = {
  oninit: (vnode) => {
    vnode.state.holders = vnode.attrs.holders;
  },
  view: (vnode) => {
    return m(
      'section.LandingPageTokenHolders',
      { class: 'container' },
      [
        m('h2',
          { class: 'text-3xl font-bold mb-5 text-center' },
          ' Token holders come together '),
        m('p',
          { class: 'text-2xl max-w-screen-sm mx-auto text-center mb-10' },
          ' Find your community and drive your token forward. '),
        m('div',
          { class: 'text-center' },
          m('a',
            { class: 'btn-outline text-xl px-6 rounded-lg pb-3', href: '' },
            'Find your community')),
        m('div',
          {
            class: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20',
          },
          vnode.state.holders.map((holder: any) => {
            return m('div', { class: 'text-center lg:text-left' }, [
              m('img', {
                class: 'w-28 h-28 mx-auto lg:mx-0',
                src: holder.img,
                alt: holder.alt,
              }),
              m('h3', { class: 'mt-4 text-2xl font-bold mb-1' }, holder.title),
              m('p', { class: 'text-lg' }, holder.text),
            ]);
          })),
      ]
    );
  },
};

export default TokenHoldersComponent;
