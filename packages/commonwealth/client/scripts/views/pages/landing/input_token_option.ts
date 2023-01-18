
import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

const ADD_TOKEN_LINK = 'https://hicommonwealth.typeform.com/to/cRP27Rp5';

interface IAttrs {
  iconImg: string;
  text: string;
  route: string;
}

const InputTokenOptionComponent: Component<IAttrs, {}> = {
  view: (vnode) => {
    const { iconImg } = vnode.attrs;
    let tokenImage;
    if (!iconImg || !iconImg.length || iconImg.slice(0, 4) === 'ipfs') {
      tokenImage = render('.TokenIcon', [
        render('.token-icon.no-image', {
          style: 'width: 1.5rem; height: 1.5rem; margin-right: 1rem;',
          onClick
        }, [
          render('span', {
            style: 'font-size: 1.25rem;'
          }, vnode.attrs.text.slice(0, 1))
        ])
      ]);
    } else {
      tokenImage = render('img', {
        class: 'mr-4 h-6 w-6',
        src: iconImg,
        alt: '',
      });
    }
    return render(
      'li',
      render(
        'button',
        {
          type: 'button',
          onClick: (e) => {
            if (vnode.attrs.route === 'placeholder') {
              e.preventDefault();
              window.location.href = ADD_TOKEN_LINK;
            } else {
              e.preventDefault();
              localStorage['home-scrollY'] = window.scrollY;
              setRoute(`/${vnode.attrs.route}`);
            }
          },
          class:
            'p-3 rounded hover:bg-gray-100 flex flex-grow items-center flex-row text-left leading-none w-full justify-between focus:outline-none',
        },
        render('span', { class: 'flex flex-row font-bold' }, [
          tokenImage,
          render('span', { class: 'mt-1' }, vnode.attrs.text),
        ])
      )
    );
  },
};

export default InputTokenOptionComponent;
