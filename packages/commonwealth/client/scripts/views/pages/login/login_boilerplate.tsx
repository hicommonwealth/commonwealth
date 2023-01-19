/* @jsx m */

import ClassComponent from 'class_component';

import { modalRedirectClick } from 'helpers';
import m from 'mithril';

import 'pages/login/login_boilerplate.scss';
import { CWText } from '../../components/component_kit/cw_text';
import { getClasses } from '../../components/component_kit/helpers';

type LoginBoilerplateAttrs = {
  darkMode?: boolean;
};

export class LoginBoilerplate extends ClassComponent<LoginBoilerplateAttrs> {
  view(vnode: m.Vnode<LoginBoilerplateAttrs>) {
    const { darkMode } = vnode.attrs;

    return (
      <div
        class={getClasses<{ darkMode?: boolean }>(
          { darkMode },
          'LoginBoilerplate'
        )}
      >
        <CWText type="caption" className="boilerplate-text" isCentered>
          By connecting to Common, you agree to our{' '}
          <a
            class="link"
            onclick={(e) => {
              modalRedirectClick(e, '/terms');
            }}
          >
            Terms of Service
          </a>{' '}
          and{' '}
          <a
            class="link"
            onclick={(e) => {
              modalRedirectClick(e, '/privacy');
            }}
          >
            Privacy Policy
          </a>
        </CWText>
      </div>
    );
  }
}
