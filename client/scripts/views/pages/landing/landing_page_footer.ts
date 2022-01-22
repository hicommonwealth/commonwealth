import m from 'mithril';
import 'pages/landing/landing_page_footer.scss';
import app from 'state';

interface IState {
  list: { text: string; redirectTo?: string, externalLink?: string }[];
}

const FooterLandingPage: m.Component<IState, IState> = {
  view: (vnode) => {
    const redirectClick = (route) => {
      m.route.set(route);
    };
    const sidebarOpen = app.chain !== null;
    let footerClass = 'footer.FooterLandingPage';
    if (sidebarOpen) {
      footerClass = 'footer.FooterLandingPage.sidebar'
    }

    return m(footerClass, { class: 'bg-footer bg-cover py-10' },
      m('div', { class: 'mt-8 container mx-auto md:flex md:flex-row md:justify-between md:items-start' }, [
        m('div', [
          m('img', {
            class: 'w-60',
            src: '/static/img/logo.svg',
            alt: 'Commonwealth',
          })
        ]),
        m('div', [
          m('nav',
            { class: 'mt-10 md:mt-0 w-64' },
            m('ul', { class: `flex flex-wrap flex-col ${vnode.attrs.list.length > 6 ? 'h-32' : 'h-24'}` }, [
              vnode.attrs.list.map((item) => {
                return m('li.FooterNavsLinks', { class: 'mb-2' }, [
                  item.redirectTo
                    ? m('a', {
                      class: 'text-gray-500',
                      onclick: (e) => {
                        e.preventDefault();
                        redirectClick(item.redirectTo);
                      },
                    },
                    item.text)
                    : m('a', {
                      class: 'text-gray-500',
                      href: item.externalLink,
                      target: '_blank'
                    }, item.text)
                ]);
              }),
            ]))
        ]),
      ]));
  },
};

export default FooterLandingPage;
