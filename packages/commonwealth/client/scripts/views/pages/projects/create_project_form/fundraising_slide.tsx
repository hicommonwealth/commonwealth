/* @jsx m */

import m from 'mithril';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { CWTokenInput } from 'views/components/component_kit/cw_token_input';
import { CWDropdown } from 'views/components/component_kit/cw_dropdown';
import ClassComponent from 'class_component';
import { validateProjectForm } from '../helpers';
import { ICreateProjectForm, WethUrl, weekInSeconds } from '../types';

export class FundraisingSlide
  extends ClassComponent<{ form: ICreateProjectForm }>
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
          options={[{
            label: 'WETH',
            value: 'WETH',
          }]}
          initialValue={{ label: 'WETH', value: 'WETH' }}
          label="Raise In"
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
          value={vnode.attrs.form.threshold.toString()}
        />
        <CWDropdown
          options={[
            { label: '1 week', value: '1' },
            { label: '2 weeks', value: '2' },
            { label: '3 weeks', value: '3' },
            { label: '4 weeks', value: '4' },
          ]}
          label="Fundraising Period"
          onSelect={(item) => {
            const lengthInSeconds = Number(item.value) * weekInSeconds;
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
