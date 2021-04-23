import m from 'mithril';
import './landing_page_footer.scss';

interface IState {
  list: { text: string; href: string }[];
}

const FooterLandingPage: m.Component<IState, IState> = {
  oninit: (vnode) => {
    vnode.state.list = vnode.attrs.list;
  },
  view: (vnode) => {
    return m(
      'footer',
      { class: 'bg-footer bg-cover py-10' },
      m(
        'div',
        {
          class:
            'mt-8 container mx-auto md:flex md:flex-row md:justify-between md:items-start',
        },
        [
          m(
            'div',
            m('img', {
              class: 'w-60',
              src: 'static/img/logo.svg',
              alt: 'Commonwealth',
            })
          ),
          m(
            'div',
            m(
              'nav',
              { class: 'mt-10 md:mt-0 w-64' },
              m('ul', { class: 'flex flex-wrap flex-col h-32' }, [
                vnode.state.list.map((item) => {
                  return m(
                    'li.FooterNavsLinks',
                    { class: 'mb-2' },
                    m(
                      'a',
                      { class: 'text-gray-500', href: item.href },
                      item.text
                    )
                  );
                }),
              ])
            )
          ),
        ]
      )
    );
  },
};

export default FooterLandingPage;
