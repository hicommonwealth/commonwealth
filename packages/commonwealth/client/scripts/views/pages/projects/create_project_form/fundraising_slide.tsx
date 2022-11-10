/* @jsx m */

import m from 'mithril';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { CWTokenInput } from 'views/components/component_kit/cw_token_input';
import { CWDropdown } from 'views/components/component_kit/cw_dropdown';
import { validateProjectForm } from '../helpers';
import { ICreateProjectForm, WethUrl, weekInSeconds } from '../types';

export class FundraisingSlide
  implements m.ClassComponent<{ form: ICreateProjectForm }>
{
  private tokenName = 'WETH';

  view(vnode: m.Vnode<{ form: ICreateProjectForm }>) {
    return (
      <form class="FundraisingSlide">
        <CWText type="h1">Fundraising and Length</CWText>
        <CWText type="caption">
          Select what token type, your goal funding goal and period as well as
          what address the funds will be going.
        </CWText>
        <CWDropdown
          menuItems={[
            {
              label: 'WETH',
            },
          ]}
          label="Raise In"
          uniqueId="token-selector"
        />
        <CWTokenInput
          label="Goal"
          name="Goal"
          inputValidationFn={(val: string) =>
            validateProjectForm('threshold', val)
          }
          oninput={(e) => {
            vnode.attrs.form.threshold = e.target.value;
          }}
          required
          tokenIconUrl={WethUrl}
          value={vnode.attrs.form.threshold}
        />
        <CWDropdown
          menuItems={['1 week', '2 weeks', '3 weeks', '4 weeks'].map(
            (length) => {
              return { label: length };
            }
          )}
          label="Fundraising Period"
          onSelect={(length: string) => {
            const lengthInSeconds = +length.split(' ')[0] * weekInSeconds;
            vnode.attrs.form.fundraiseLength = lengthInSeconds;
          }}
          uniqueId="length-selector"
        />
        <CWTextInput
          placeholder="Address"
          label="Beneficiary Address"
          name="Beneficiary Address"
          inputValidationFn={(val: string) =>
            validateProjectForm('beneficiary', val)
          }
          oninput={(e) => {
            vnode.attrs.form.beneficiary = e.target.value;
          }}
          required
          value={vnode.attrs.form.beneficiary}
        />
        <CWTextInput
          placeholder="Set Quantity"
          label="Curator Fee (%)"
          name="Curator Fee"
          oninput={(e) => {
            vnode.attrs.form.curatorFee = e.target.value;
          }}
          inputValidationFn={(val: string) =>
            validateProjectForm('curatorFee', val)
          }
          value={vnode.attrs.form.curatorFee}
        />
      </form>
    );
  }
}
