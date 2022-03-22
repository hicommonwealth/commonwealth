/* @jsx m */

import m from 'mithril';

import 'pages/landing/landing_page_footer.scss';

import app from 'state';

type IState = {
  list: { text: string; redirectTo?: string; externalLink?: string }[];
};

export class LandingPageFooter implements m.ClassComponent<IState> {
  view(vnode) {
    const redirectClick = (route) => {
      m.route.set(route);
    };

    let footerClass = 'FooterLandingPage';

    if (app.chain !== null) {
      footerClass = 'FooterLandingPage.sidebar';
    }

    return (
      <footer class={`${footerClass} bg-footer bg-cover py-10`}>
        <div class="mt-8 container mx-auto md:flex md:flex-row md:justify-between md:items-start">
          <img class="w-60" src="/static/img/logo.svg" alt="Commonwealth" />
          <nav class="mt-10 md:mt-0 w-64">
            <ul
              class={`flex flex-wrap flex-col ${
                vnode.attrs.list.length > 6 ? 'h-32' : 'h-24'
              }`}
            >
              {vnode.attrs.list.map((item) => {
                return (
                  <li class="FooterNavsLinks mb-2">
                    {item.redirectTo ? (
                      <a
                        class="text-gray-500"
                        onclick={(e) => {
                          e.preventDefault();
                          redirectClick(item.redirectTo);
                        }}
                      >
                        {item.text}
                      </a>
                    ) : (
                      <a
                        class="text-gray-500"
                        href={item.externalLink}
                        target="_blank"
                      >
                        {item.text}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </footer>
    );
  }
}
