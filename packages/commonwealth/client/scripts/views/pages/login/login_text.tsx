/* @jsx jsx */


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import 'pages/login/login_text.scss';

import { CWText } from '../../components/component_kit/cw_text';
import {
  getClasses,
  isWindowExtraSmall,
} from '../../components/component_kit/helpers';

type LoginTextAttrs = {
  bodyText: string;
  className?: string;
  headerText: string;
  isMobile?: boolean;
};

export class LoginText extends ClassComponent<LoginTextAttrs> {
  view(vnode: ResultNode<LoginTextAttrs>) {
    const { bodyText, className, headerText, isMobile = false } = vnode.attrs;

    return (
      <div
        className={getClasses<{ className?: string }>({ className }, 'LoginText')}
      >
        <div className="header-container">
          <CWText
            type={
              isWindowExtraSmall(window.innerWidth)
                ? 'h3'
                : isMobile
                ? 'h2'
                : 'h4'
            }
            fontWeight="semiBold"
            isCentered={isMobile}
            class="header-text"
          >
            {headerText}
          </CWText>
        </div>
        <CWText
          type={isMobile ? 'h5' : 'b2'}
          isCentered={isMobile}
          class={getClasses<{ isMobile?: boolean }>(
            { isMobile },
            'body-text'
          )}
        >
          {bodyText}
        </CWText>
      </div>
    );
  }
}
