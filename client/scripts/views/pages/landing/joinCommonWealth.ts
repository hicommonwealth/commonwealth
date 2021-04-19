import m from 'mithril';

const JoinCommonWealthSection: m.Component<{}, {}> = {
  view: (vnode) => {
    return m(
      'section',
      { class: 'h-80 bg-gray-900 flex items-center mt-20' },
      m(
        'div',
        { class: 'container mx-auto' },
        m('div', { class: 'flex flex-col md:flex-row md:justify-between' }, [
          m('div', [
            m(
              'h2',
              { class: 'text-white font-extrabold text-3xl' },
              ' A community for every token. '
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
            // Needs to be componentized since its being used in first section
            m(
              'button',
              { class: 'btn-gradient pb-3' },
              m('span', { class: 'btn-white text-xl py-3 px-8 rounded-lg' }, [
                ' Join yours ',
                m('img', {
                  class: 'inline ml-1.5',
                  src: 'static/img/arrow-right-black.svg',
                  alt: "Let's Go",
                }),
              ])
            )
          ),
        ])
      )
    );
  },
};

export default JoinCommonWealthSection;
