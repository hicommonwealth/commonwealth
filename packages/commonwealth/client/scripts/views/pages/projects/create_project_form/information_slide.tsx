/* @jsx m */
import app from 'state';
import _ from 'lodash';
import m from 'mithril';

import { Button, Icons, SelectList } from 'construct-ui';
import { Account, ChainInfo } from 'models';
import CWCoverImageUploader from '../../../components/component_kit/cw_cover_image_uploader';
import { CWText } from '../../../components/component_kit/cw_text';
import { CWTextArea } from '../../../components/component_kit/cw_text_area';
import { CWTextInput } from '../../../components/component_kit/cw_text_input';
import {
  getAllEthChains,
  getUserEthChains,
  validateProjectForm,
} from '../helpers';
import { ICreateProjectForm } from '../types';

export class InformationSlide
  implements m.ClassComponent<{ form: ICreateProjectForm }>
{
  view(vnode: m.Vnode<{ form: ICreateProjectForm }>) {
    if (!app) return;
    if (vnode.attrs.form.chainId !== app.activeChainId()) {
      vnode.attrs.form.chainId = app.activeChainId();
    }
    const allEthChains = getAllEthChains(app);
    const userEthChains = getUserEthChains(app);
    const defaultChainIdx = userEthChains
      .concat(allEthChains)
      .findIndex((c) => c.id === app.activeChainId());
    const selectedChain = userEthChains.find(
      (c) => c.id === vnode.attrs.form.chainId
    );

    const chainAccounts = app.user.activeAccounts;

    return (
      <form class="InformationSlide">
        <CWText type="h1">General Information</CWText>
        <CWText type="caption">
          Name your crowdfund, add a brief card description and upload a header
          image.
        </CWText>
        <CWTextInput
          placeholder="Your Project Name Here"
          label="Name Your Crowdfund"
          name="Name"
          oninput={(e) => {
            vnode.attrs.form.title = e.target.value;
          }}
          inputValidationFn={(val: string) => validateProjectForm('title', val)}
          required
          value={vnode.attrs.form.title}
        />
        <SelectList
          class="chain-info-list"
          items={userEthChains.concat(allEthChains)}
          itemPredicate={(query: string, item: ChainInfo) => {
            return (
              item.id.toLowerCase().includes(query.toLowerCase()) ||
              item.name.toLowerCase().includes(query.toLowerCase())
            );
          }}
          itemRender={(c: ChainInfo) => (
            <CWText disabled={!userEthChains.includes(c)}>{c.name}</CWText>
          )}
          defaultActiveIndex={defaultChainIdx}
          onSelect={(n: ChainInfo) => {
            m.route.set(`/${n.id}/new/project`);
          }}
          trigger={
            <Button
              align="left"
              compact={true}
              iconRight={Icons.CHEVRON_DOWN}
              sublabel={<CWText>Chain:</CWText>}
              label={selectedChain.name}
            />
          }
        />
        <SelectList
          class="account-address-list"
          items={chainAccounts}
          itemPredicate={(query: string, item: Account) => {
            return (
              item.address.toLowerCase().includes(query.toLowerCase()) ||
              item.profile.displayName
                .toLowerCase()
                .includes(query.toLowerCase())
            );
          }}
          itemRender={(a: Account) => <CWText>{a.address}</CWText>}
          defaultActiveIndex={0}
          onSelect={(a: Account) => {
            vnode.attrs.form.creator = a.address;
          }}
          trigger={
            <Button
              align="left"
              compact={true}
              iconRight={Icons.CHEVRON_DOWN}
              label={vnode.attrs.form.creator}
            />
          }
        />
        <CWTextArea
          placeholder="Write a short 2 or 3 sentence description of your project,"
          label="Short Description"
          name="Short Description"
          oninput={(e) => {
            vnode.attrs.form.shortDescription = e.target.value;
          }}
          inputValidationFn={(val: string) =>
            validateProjectForm('shortDescription', val)
          }
          required
          value={vnode.attrs.form.shortDescription}
        />
        <CWCoverImageUploader
          headerText="Cover Image"
          subheaderText="Use an image that helps people connect with your crowdfund right away"
          uploadCompleteCallback={(imageURL: string) => {
            vnode.attrs.form.coverImage = imageURL;
          }}
        />
      </form>
    );
  }
}
