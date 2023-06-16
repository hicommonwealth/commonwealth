import React from 'react';

import { ChainBase, ChainNetwork, ProposalType } from 'common-common/src/types';

import app from 'state';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import type { PopoverMenuItem } from '../components/component_kit/cw_popover/cw_popover_menu';
import type { DefaultMenuItem } from '../components/component_kit/types';
import { PopoverMenu } from '../components/component_kit/cw_popover/cw_popover_menu';
import { CWMobileMenu } from '../components/component_kit/cw_mobile_menu';

import { CWSidebarMenu } from '../components/component_kit/cw_sidebar_menu';
import { useCommonNavigate } from 'navigation/helpers';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import useSidebarStore, { sidebarStore } from 'state/ui/sidebar';

import { CWCard } from '../components/component_kit/cw_card';
import { CWText } from '../components/component_kit/cw_text';
import { CWButton } from '../components/component_kit/cw_button';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import { SelectList } from '../components/component_kit/cw_select_list';
import { AaveProposalForm } from '../pages/new_proposal/aave_proposal_form';

const AddDraftERC20Component = () => {
  const tokenOptions = [
    { value: 'USDC', label: 'USDC' },
    { value: 'WETH', label: 'WETH' },
    { value: 'UNI', label: 'UNI' },
    { value: 'COMP', label: 'COMP' },
    { value: 'OSMO', label: 'OSMO' },
  ];

  return (
    <div style={{ width: '100%' }}>
      <CWText type="h3" fontWeight="semiBold" className="header-text">
        Add Draft ERC20 Spend Proposal
      </CWText>
      <CWText className="explanation-text">
        Fill out the form below to create a draft ERC20 spend proposal.
      </CWText>
      <form>
        <CWTextInput placeholder="500" className="input-amount" />
        <SelectList
          options={tokenOptions}
          className="input-token"
          placeholder="Select Token"
        />
      </form>
    </div>
  );
};

const PrefilledComponent = () => {
  return (
    <div style={{ width: '100%' }}>
      <CWText type="h3" fontWeight="semiBold" className="header-text">
        Prefilled ERC20 Spend Proposal
      </CWText>
      <CWText className="explanation-text">
        The proposal has been prefilled with the following values:
      </CWText>
      <pre>
        <code>
          {`{
  Amount: 1,000,000,
  Token: OSMO
}`}
        </code>
      </pre>
    </div>
  );
};

const ImageRewardCard = ({ key }) => {
  return (
    <CWCard elevation="elevation-1" className="image-collect-card">
      <div className="header-row">
        <div style={{ width: '100px' }}>
          <iframe
            allow="fullscreen"
            frameBorder="0"
            height="150"
            src="https://giphy.com/embed/ILVQK9gcdtIoPJEF4K"
            width="150"
          ></iframe>
        </div>
      </div>
      <CWText className="subheader-text">
        {' '}
        Rewarded to the Top post of the week, right now you're in 3rd place,
        you'll need 50 more upvotes{' '}
      </CWText>
      <CWButton
        color="primary"
        className="collect-post-button"
        onClick={() => console.log('Collect Post')}
        label={'collect'}
        disabled={true}
      >
        Claim Reward
      </CWButton>
    </CWCard>
  );
};

const ImageCollectCard = ({ key }) => {
  return (
    <CWCard elevation="elevation-1" className="image-collect-card">
      <div className="header-row">
        <div style={{ width: '100px' }}>
          <iframe
            allow="fullscreen"
            frameBorder="0"
            height="150"
            src="https://giphy.com/embed/NrF0O24dP5NuYund2x/video"
            width="150"
          ></iframe>
        </div>
      </div>
      <CWButton
        color="primary"
        className="collect-post-button"
        onClick={() => console.log('Collect Post')}
        label={'collect'}
      >
        Collect Post
      </CWButton>
    </CWCard>
  );
};

const CreatorCard = ({ key }) => {
  return (
    <CWCard elevation="elevation-1" className="creation-card">
      <div className="header-row">
        <CWText type="h3" fontWeight="semiBold" className="header-text">
          500 USDC
        </CWText>
        <div className="count-and-button">
          <CWText
            type="caption"
            fontWeight="medium"
            className="thread-count-text"
          >
            This is the {key}
          </CWText>
        </div>
      </div>
      <CWText className="subheader-text">
        Rewarded by Dillon, if you find a bug that will cause serious harm to
        the proposal
      </CWText>
    </CWCard>
  );
};

const DropDownFormCard = () => {
  return (
    <CWCard elevation="elevation-1" className="creation-card">
      <div className="header-row">
        <CWText type="h3" fontWeight="semiBold" className="header-text">
          Poll
        </CWText>
      </div>
      <CWText className="subheader-text">
        This is the proposal: should Vitalik be king?
      </CWText>
      <DropDownForm />
    </CWCard>
  );
};

export default DropDownFormCard;

// A form with three drop down inputs that each have 1 2 3 as options
const DropDownForm = () => {
  return (
    <div className="drop-down-form">
      <select>
        <option value="1">1</option>
      </select>
      <select>
        <option value="2">2</option>
      </select>
      <select>
        <option value="3">3</option>
      </select>
      <CWButton
        color="primary"
        className="collect-post-button"
        onClick={() => console.log('Vote')}
        label={'vote'}
      >
        Submit Vote
      </CWButton>
    </div>
  );
};

export const getCreateContentMenuItems = (navigate): PopoverMenuItem[] => {
  const showSnapshotOptions =
    app.user.activeAccount && !!app.chain?.meta.snapshot.length;

  const topics = app.topics
    .getByCommunity(app.activeChainId())
    .reduce(
      (acc, current) => (current.featuredInNewPost ? [...acc, current] : acc),
      []
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const showSputnikProposalItem = app.chain?.network === ChainNetwork.Sputnik;

  const showOnChainProposalItem =
    (app.chain?.base === ChainBase.CosmosSDK &&
      app.chain?.network !== ChainNetwork.Terra &&
      app.chain?.network !== ChainNetwork.Kava) ||
    (app.chain?.base === ChainBase.Ethereum &&
      app.chain?.network === ChainNetwork.Aave) ||
    app.chain?.network === ChainNetwork.Compound;

  const showSubstrateProposalItems =
    app.chain?.base === ChainBase.Substrate &&
    app.chain?.network !== ChainNetwork.Plasm;

  const getTemplateItems = (): PopoverMenuItem[] => {
    const contracts = app.contracts.getCommunityContracts();

    const items = [];

    contracts.forEach((contract) => {
      if (contract.ccts) {
        for (const cct of contract.ccts) {
          if (
            cct.cctmd.display_options === '2' ||
            cct.cctmd.display_options === '3'
          ) {
            const slugWithSlashRemoved = cct.cctmd.slug.replace('/', '');
            items.push({
              label: `New ${cct.cctmd.nickname}`,
              iconLeft: 'star',
              onClick: () =>
                navigate(`/${contract.address}/${slugWithSlashRemoved}`),
            });
          }
        }
      }
    });

    return items;
  };

  const getTopicTemplateItems = (): PopoverMenuItem[] =>
    topics.map((t) => ({
      label: `New ${t.name} Thread`,
      iconLeft: 'write',
      onClick: () => {
        // TODO Graham 7-19-22: Let's find a non-localStorage solution
        localStorage.setItem(`${app.activeChainId()}-active-topic`, t.name);
        if (t.defaultOffchainTemplate) {
          localStorage.setItem(
            `${app.activeChainId()}-active-topic-default-template`,
            t.defaultOffchainTemplate
          );
        } else {
          localStorage.removeItem(
            `${app.activeChainId()}-active-topic-default-template`
          );
        }
        navigate('/new/discussion');
      },
    }));

  const getOnChainProposalItem = (): PopoverMenuItem[] =>
    showOnChainProposalItem
      ? [
          {
            label: 'Add New Proposal',
            location: 'mainContent',
            component: <AaveProposalForm />,
            onClick: () => console.log('clicked New Proposal'),
            // navigate('/:scope/new/contract_template/:contract_id', {
            //   state: { scoped: true, deferChain: true },
            // }),
            iconLeft: 'star',
          },
        ]
      : [];

  const getSputnikProposalItem = (): PopoverMenuItem[] =>
    showSputnikProposalItem
      ? [
          {
            label: 'New Sputnik proposal',
            onClick: () => navigate('/new/proposal'),
            iconLeft: 'democraticProposal',
          },
        ]
      : [];

  const getSubstrateProposalItems = (): PopoverMenuItem[] =>
    showSubstrateProposalItems
      ? [
          {
            label: 'New treasury proposal',
            onClick: () =>
              navigate('/new/proposal/:type', {
                type: ProposalType.SubstrateTreasuryProposal,
              }),
            iconLeft: 'treasuryProposal',
          },
          {
            label: 'New democracy proposal',
            onClick: () =>
              navigate('/new/proposal/:type', {
                type: ProposalType.SubstrateDemocracyProposal,
              }),
            iconLeft: 'democraticProposal',
          },
          {
            label: 'New tip',
            onClick: () =>
              navigate('/new/proposal/:type', {
                type: ProposalType.SubstrateTreasuryTip,
              }),
            iconLeft: 'jar',
          },
        ]
      : [];

  const getSnapshotProposalItem = (): PopoverMenuItem[] =>
    showSnapshotOptions
      ? [
          {
            label: 'New Snapshot Proposal',
            iconLeft: 'democraticProposal',
            onClick: () => {
              const snapshotSpaces = app.chain.meta.snapshot;
              if (snapshotSpaces.length > 1) {
                navigate('/multiple-snapshots', {
                  action: 'create-proposal',
                });
              } else {
                navigate(`/new/snapshot/${snapshotSpaces}`);
              }
            },
          },
        ]
      : [];

  const getUniversalCreateItems = (): PopoverMenuItem[] => [
    // {
    //   label: 'New Crowdfund',
    //   iconLeft: 'wallet',
    //   onClick: () => {

    //   }
    // },
    {
      label: 'New Community',
      iconLeft: 'people',
      onClick: (e) => {
        e?.preventDefault();
        sidebarStore.getState().setMenu({ name: 'default', isVisible: false });
        navigate('/createCommunity', {}, null);
      },
    },
    {
      label: 'Gate your Discord',
      iconLeft: 'discord',
      onClick: (e) => {
        e?.preventDefault();
        sidebarStore.getState().setMenu({ name: 'default', isVisible: false });

        window.open(
          `https://discord.com/oauth2/authorize?client_id=${
            process.env.DISCORD_CLIENT_ID
          }&permissions=8&scope=applications.commands%20bot&redirect_uri=${encodeURI(
            process.env.DISCORD_UI_URL
          )}/callback&response_type=code&scope=bot`
        );
      },
    },
  ];

  const getContractItems = (): PopoverMenuItem[] =>
    app.chain?.base === ChainBase.Ethereum
      ? [
          {
            label: 'Add Template ERC20 Spend Proposal',
            location: 'mainContent',
            component: <AddDraftERC20Component />,
            onClick: () => console.log('clicked add template erc20 spend'),
            iconLeft: 'star',
          },
          {
            label: 'Add Draft ERC20 Spend Proposal',
            location: 'mainContent',
            component: <PrefilledComponent />,
            onClick: () => console.log('clicked add draft erc20 spend'),
            // navigate('/:scope/new/contract_template/:contract_id', {
            //   state: { scoped: true, deferChain: true },
            // }),
            iconLeft: 'star',
          },
        ]
      : [];

  const getDummyItems = (): PopoverMenuItem[] =>
    app.chain?.base === ChainBase.Ethereum
      ? [
          {
            label: 'Add Bounty to Page',
            onClick: () => console.log('clicked add bounty to page'),
            iconLeft: 'star',
            location: 'cardColumn',
            component: <CreatorCard key={Date.now()} />,
            description: `Adds a bounty for completing a specific action on a page. 
              Like posting the highest upvoted comment.`,
          },
          {
            label: 'Top Post of the Week',
            location: 'cardColumn',
            component: <ImageRewardCard key={'collect'} />,
            onClick: () => console.log('clicked collect to page'),
            // navigate('/:scope/new/contract_template/:contract_id', {
            //   state: { scoped: true, deferChain: true },
            // }),
            iconLeft: 'star',
            description: `You can claim this if you got the top post of the week`,
          },
          {
            label: 'Allow Collects',
            location: 'cardColumn',
            component: <ImageCollectCard key={'collect'} />,
            onClick: () => console.log('clicked collect to page'),
            // navigate('/:scope/new/contract_template/:contract_id', {
            //   state: { scoped: true, deferChain: true },
            // }),
            iconLeft: 'star',
            description: `Allows your post to be collected as an NFT!`,
          },
        ]
      : [];

  const getPostItems = (): PopoverMenuItem[] =>
    app.chain?.base === ChainBase.Ethereum
      ? [
          {
            label: 'Add Poll Link',
            onClick: () => console.log('clicked add thread link'),
            location: 'cardColumn',
            component: <DropDownFormCard />,
            iconLeft: 'star',
            description: `Add a poll directly from here!`,
          },
          {
            label: 'Add Proposal Link',
            onClick: () =>
              navigate('/:scope/new/contract_template/:contract_id', {
                state: { scoped: true, deferChain: true },
              }),
            iconLeft: 'star',
            description: `Allows your post to be collected as an NFT!`,
          },
          {
            label: 'Add Thread Link',
            location: 'cardColumn',
            onClick: () =>
              navigate('/:scope/new/contract_template/:contract_id', {
                state: { scoped: true, deferChain: true },
              }),
            iconLeft: 'star',
          },
          {
            label: 'Create Snapshot',
            onClick: () =>
              navigate('/:scope/new/contract_template/:contract_id', {
                state: { scoped: true, deferChain: true },
              }),
            iconLeft: 'star',
            description: `Create an Snapshot Proposal!`,
          },
        ]
      : [];

  return [
    ...(app.activeChainId()
      ? [
          // {
          //   type: 'header',
          //   label: 'Create Within Community',
          // } as PopoverMenuItem,
          {
            label: 'New Thread',
            onClick: () => {
              sidebarStore
                .getState()
                .setMenu({ name: 'default', isVisible: false });
              navigate('/new/discussion');
            },
            iconLeft: 'write',
          } as PopoverMenuItem,
          // ...getTopicTemplateItems(),
          ...getOnChainProposalItem(),
          // ...getSputnikProposalItem(),
          // ...getSubstrateProposalItems(),
          // ...getSnapshotProposalItem(),
        ]
      : []),
    {
      type: 'header',
      label: 'Add Contract',
    } as PopoverMenuItem,
    ...getTemplateItems(),
    ...getContractItems(),
    {
      type: 'header',
      label: 'Add Bounty',
    } as PopoverMenuItem,
    ...getDummyItems(),
    ...getPostItems(),
    // {
    //   type: 'header',
    //   label: 'Add Bounty',
    // } as PopoverMenuItem,
    // ...getDummyItems(),
    // {
    //   type: 'header',
    //   label: 'Add Bounty',
    // } as PopoverMenuItem,
    // ...getDummyItems(),
    // {
    //   type: 'header',
    //   label: 'Add Bounty',
    // } as PopoverMenuItem,
    // ...getDummyItems(),
    // {
    //   type: 'header',
    //   label: 'Add Bounty',
    // } as PopoverMenuItem,
    // ...getDummyItems(),
    // {
    //   type: 'header',
    //   label: 'Add Bounty',
    // } as PopoverMenuItem,
    // ...getDummyItems(),
    // {
    //   type: 'header',
    //   label: 'Universal Create',
    // },
    // ...getUniversalCreateItems(),
  ];
};

export const CreateContentSidebar = () => {
  const navigate = useCommonNavigate();
  const { setMenu } = useSidebarStore();

  return (
    <CWSidebarMenu
      className="CreateContentSidebar"
      menuHeader={{
        label: 'Create',
        onClick: async () => {
          const sidebar = document.getElementsByClassName(
            'CreateContentSidebar'
          );
          sidebar[0].classList.add('onremove');
          setTimeout(() => {
            setMenu({ name: 'default', isVisible: false });
          }, 200);
        },
      }}
      menuItems={getCreateContentMenuItems(navigate)}
    />
  );
};

export const CreateContentRightSidebar = ({ addComponent }) => {
  const navigate = useCommonNavigate();
  const { setRightMenu } = useSidebarStore();

  function isDefaultMenuItem(item: any): item is DefaultMenuItem {
    return item.type === 'DefaultMenuItem';
  }

  function hasOnClick(item: PopoverMenuItem): item is DefaultMenuItem {
    return 'onClick' in item;
  }

  const updatedMenuItems = getCreateContentMenuItems(navigate).map((item) => {
    if (!hasOnClick(item) || !addComponent) {
      return item;
    }

    const originalOnClick = item.onClick;
    const component = item.component;
    const location = item.location;

    return {
      ...item,
      onClick: () => {
        console.log('addComponent in here', addComponent);
        addComponent(component, location);
        originalOnClick();
      },
    };
  });

  return (
    <CWSidebarMenu
      className="CreateContentRightSidebar"
      menuHeader={{
        label: 'Create',
        onClick: async () => {
          const sidebar = document.getElementsByClassName(
            'CreateContentRightSidebar'
          );
          sidebar[0].classList.add('onremove');
          setTimeout(() => {
            setRightMenu({ isVisible: false });
          }, 200);
        },
      }}
      menuItems={updatedMenuItems}
    />
  );
};

export const CreateContentMenu = () => {
  const navigate = useCommonNavigate();
  const { setMobileMenuName } = useSidebarStore();

  return (
    <CWMobileMenu
      className="CreateContentMenu"
      menuHeader={{
        label: 'Create',
        onClick: () => setMobileMenuName('MainMenu'),
      }}
      menuItems={getCreateContentMenuItems(navigate)}
    />
  );
};

export const CreateContentPopover = () => {
  const navigate = useCommonNavigate();
  const { isLoggedIn } = useUserLoggedIn();

  if (
    !isLoggedIn ||
    !app.chain ||
    !app.activeChainId() ||
    !app.user.activeAccount
  ) {
    return;
  }

  return (
    <PopoverMenu
      menuItems={getCreateContentMenuItems(navigate)}
      renderTrigger={(onclick) => (
        <CWIconButton
          iconButtonTheme="black"
          iconName="plusCircle"
          onClick={onclick}
        />
      )}
    />
  );
};
