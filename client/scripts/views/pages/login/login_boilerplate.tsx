/* @jsx m */

import m from 'mithril';

import 'pages/login/login_boilerplate.scss';

import { modalRedirectClick } from 'helpers';
import { CWText } from '../../components/component_kit/cw_text';

export class LoginBoilerplate implements m.ClassComponent {
  view() {
    return (
      <CWText type="caption" className="LoginBoilerplate">
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
    );
  }
}
