# Templating Engine > Contract Action Templates

Contract Action Templates enable admins of communities within Common to execute contract actions in a low code environment. Contract actions include changes or updates to the underlying smart contract such as proposals, token transfers, delegations etc. To use Contract Action Templates you will need to be an admin of a community on Common

The smart contracts currently supported for Contract Action Templates are:

- Governor (Alpha/Bravo/OpenZeppelin)
- ERC721/ERC1155
- ERC20
- AAVE
- MolochDAO

## How It Works

- Navigate to the community you are an admin of using the search panel. Within the community page, navigate to Contracts under Admin Capabilities
- Click on Add Contract on the right top corner. This will prompt you to add the Contract Address for your smart contract. The Contract ABI file will be visible once you add a Contract Address that is valid and supported (refer list above)
- Once you add a contract it will be available for community members to connect to specific Contract Action Templates
- Click on connect template to bring up the Contract Action Form. You can either select from existing Contract Action Templates that are available or create a new Contract Action Template.
- To create a new Contract Action Template, click on create new template. Add the name of the Contract Action this would execute, and add the relevant JSON blob. Refer to developer documentation on how to do this (link). Here is a list of contract action templates that you can create (link)
- Select the Contract Action Template from the dropdown and fill out the details specific to the contract action that you want to execute
- Select where you’d like this Contract Action Form available
  - Create Sidebar (image)
  - Create Dropdown (image)
- Different types of templates that you can create  (format existing page)
  - Governor
    - Treasury Spend Proposal → A template that makes it easy to create a treasury spend proposal. Takes in as inputs a recipient, request amount, and other relevant metadata.
    - Vote Casting  ⇒  Vote cast template takes in as inputs proposal id and decision (yes / no / abstain), enabling communities to vote on a proposal
    - Parameter Change ⇒ a template that makes it easy to update a parameter on the protocol owned by the Governor contract
  - ERC721/ERC1155
    - SendTo
    - DelegateTo
  - ERC20
    - DelegateTo
    - SendTo
  - AAVE
    - Treasury Spend Proposal - A template that makes it easy to create a treasury spend proposal. Takes in as inputs a recipient, request amount, and other relevant metadata.
    - Vote Casting - Vote cast template takes in as inputs proposal id and decision (yes / no / abstain), enabling communities to vote on a proposal
    - Parameter Change - a template that makes it easy to update a parameter on the protocol owned by the Governor contract
  - MolochDAO
    - Submit Proposal
    - Submit Vote
    - Proposal Processing
    - Rage Quit
    - Update Delegates

## Change Log

- 230411: Authored by Alex Young
