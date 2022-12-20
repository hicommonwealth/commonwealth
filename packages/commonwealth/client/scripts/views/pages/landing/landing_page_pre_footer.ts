import m from 'mithril';
import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component } from 'mithrilInterop';

const JoinCommonWealthSection: Component<{}, {}> = {
  view: (vnode) => {
    return render(
      'section.JoinCommonWealthSection',
      { class: 'h-80 bg-gray-900 flex items-center mt-20 h-56' },
      render(
        'div',
        { class: 'container mx-auto' },
        render('div', { class: 'flex flex-col md:flex-row md:justify-between' }, [
          render('div', [
            render(
              'h2',
              { class: 'text-white font-bold text-3xl' },
              'A community for every token. '
            ),
            render(
              'p',
              { class: 'text-xl text-gray-400' },
              'Join Commonwealth today.'
            ),
          ]),
          render(
            'div',
            { class: 'flex mt-10 md:justify-end md:mt-0' },
            // render(
            //   'button',
            //   { class: 'btn-gradient pb-3' },
            //   render(
            //     'span',
            //     { class: 'btn-white flex text-xl py-3 px-8 rounded-lg' },
            //     [
            //       ' Join yours ',
            //       render('img', {
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
