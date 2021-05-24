import m from 'mithril';

const JoinCommonWealthSection: m.Component<{}, {}> = {
  view: (vnode) => {
    return m(
      'section.JoinCommonWealthSection',
      { class: 'h-80 bg-gray-900 flex items-center mt-20 h-56' },
      m(
        'div',
        { class: 'container mx-auto' },
        m('div', { class: 'flex flex-col md:flex-row md:justify-between' }, [
          m('div', [
            m(
              'h2',
              { class: 'text-white font-bold text-3xl' },
              'A community for every token. '
            ),
            m(
              'p',
              { class: 'text-xl text-gray-400' },
              'Join Commonwealth today.'
            ),
          ]),
          m(
            'div',
            { class: 'flex mt-10 md:justify-end md:mt-0' },
            // m(
            //   'button',
            //   { class: 'btn-gradient pb-3' },
            //   m(
            //     'span',
            //     { class: 'btn-white flex text-xl py-3 px-8 rounded-lg' },
            //     [
            //       ' Join yours ',
            //       m('img', {
            //         class: 'inline ml-1.5',
            //         src: 'static/img/arrow-right-black.svg',
            //         alt: "Let's Go",
            //       }),
            //     ]
            //   )
            // )
          ),
        ])
      )
    );
  },
};

export default JoinCommonWealthSection;
