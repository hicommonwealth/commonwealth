/* @jsx m */

import m from 'mithril';

import 'pages/landing/landing_page_footer.scss';

type IState = {
  list: { text: string; redirectTo?: string; externalLink?: string }[];
};

export class LandingPageFooter implements m.ClassComponent<IState> {
  view(vnode) {
    const redirectClick = (route) => {
      m.route.set(route);
    };

    return (
      <footer class="LandingPageFooter">
        <div class="">
          <img class="" src="/static/img/logo.svg" alt="Commonwealth" />
          <nav class="">
            <ul class="">
              {vnode.attrs.list.map((item) => {
                return (
                  <li class="">
                    {item.redirectTo ? (
                      <a
                        class=""
                        onclick={(e) => {
                          e.preventDefault();
                          redirectClick(item.redirectTo);
                        }}
                      >
                        {item.text}
                      </a>
                    ) : (
                      <a class="" href={item.externalLink} target="_blank">
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
