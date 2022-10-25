/* @jsx m */

import m from 'mithril';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { CWTokenInput } from 'views/components/component_kit/cw_token_input';
import { SelectList, Button, Icons } from 'construct-ui';
import { validateProjectForm } from '../helpers';
import {
  ICreateProjectForm,
  TokenOption,
  WethUrl,
  weekInSeconds,
} from '../types';

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
        <SelectList
          items={[
            {
              name: 'WETH',
              address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            },
            // {
            //   name: 'DAI',
            //   address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
            // },
            // {
            //   name: 'USDC',
            //   address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            // },
            // {
            //   name: 'RAI',
            //   address: '0x03ab458634910AaD20eF5f1C8ee96F1D6ac54919',
            // },
          ]}
          itemRender={(token: TokenOption) => {
            return (
              <div value={token.address} style="cursor: pointer">
                <CWText type="body1">{token.name}</CWText>
              </div>
            );
          }}
          filterable={false}
          label="Raise In"
          name="Raise In"
          onSelect={(token: TokenOption) => {
            this.tokenName = token.name;
            vnode.attrs.form.token = token.address;
          }}
          style="width: 441px;"
          trigger={
            <Button
              align="left"
              compact={true}
              iconRight={Icons.CHEVRON_DOWN}
              style="width: 100%;"
              label={`Raise token: ${this.tokenName}`}
            />
          }
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
        <SelectList
          items={['1 week', '2 weeks', '3 weeks', '4 weeks']}
          itemRender={(i: string) => {
            return (
              <div value={i} style="cursor: pointer">
                <CWText type="body1">{i}</CWText>
              </div>
            );
          }}
          filterable={false}
          label="Fundraising Period"
          name="Fundraising Period"
          onSelect={(length: string) => {
            const lengthInSeconds = +length.split(' ')[0] * weekInSeconds;
            vnode.attrs.form.fundraiseLength = lengthInSeconds;
          }}
          style="width: 441px;"
          trigger={
            <Button
              align="left"
              compact={true}
              iconRight={Icons.CHEVRON_DOWN}
              style="width: 100%;"
              label={`Fundraise period: ${
                vnode.attrs.form?.fundraiseLength / weekInSeconds
              } week`}
            />
          }
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
