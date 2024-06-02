**For the wallet/SSO support:**

1. [These](https://github.com/hicommonwealth/commonwealth/blob/master/libs/shared/src/types/protocol.ts#L66-L80) are all the wallet types we support
1. `magic` is the wallet type we use for SSO's account
2. `walletconnect` wallet supports a lot of Ethereum wallets, those are not mentioned in the wallet types `type`.
1. [These](https://github.com/hicommonwealth/commonwealth/blob/master/libs/shared/src/types/protocol.ts#L83-L91) are all the SSO types we support
1. the `unknown` type here is for legacy support
1. SSO accounts like Google/Github/Discord/Twitter/Apple/Email are treated as an address in the app (similar to how we treat wallet addresses)
2. Every auth method ends up giving an `address` for user account, this address can be of [these](https://github.com/hicommonwealth/commonwealth/blob/master/libs/shared/src/types/protocol.ts#L93-L99) types.
1. An exception for this is SSO accounts which either have an Ethereum or a Cosmos address.
2. If an SSO account is created in a `cosmos` based community, then the final `address` of account will be a cosmos address, in all other cases the `address` will be an Ethereum address.
1. We display wallets conditionally per context of the page, [here](https://github.com/hicommonwealth/commonwealth/blob/e888479b54582ee2dd8526ce6085184426ba1e9c/packages/commonwealth/client/scripts/views/modals/AuthModal/common/ModalBase/ModalBase.tsx#L148-L157) is the full wallet display logic with notes for which wallets gets displayed when
2. If the user doesn't have a wallet required for the context of the page, then the wallet list is empty with `No wallets found` message. The SSO list is still displayed and user can use that to signup and join a community.
3. [This](https://github.com/hicommonwealth/commonwealth/blob/master/packages/commonwealth/client/scripts/views/modals/AuthModal/common/ModalBase/ModalBase.tsx) is the **main** component responsible for rendering wallets (depending on page context) and handling auth flow. The auth logic is distributed among some other areas as well but the main component is again linked.

**For the sign-in flow:**

We were recently working on the new User-Onboarding feature which updates the sign-in flow. I will list both pre-post user-onboarding flows.

Pre-UserOnboarding:

1. The user needs to get to auth modal for signin/signup. This can be done by the `Signup` button in header or trying to perform an auth-gated action, both of which trigger the auth modal.
2. On the auth modal, wallets and SSO options are displayed, any of the options the user can select and authenticate
3. We don't make a distinction here for new vs old account. All the users are shown the same modal and are navigated with the same flow.

Post-UserOnboarding:

1. The user needs to get to auth modal for signin/signup. This can be done by the `Signup` or `Create account` button in header or trying to perform an auth-gated action, both of which trigger the auth modal.
2. Now the `Signup` modal is different from `Create account` modal. In terms of code, its the same component with a slightly different layout.
3. Assuming a user clicked on the `Create account` button, which opens the `Create account` modal
1. the user is shown 2 options, `Create a wallet` and `I have a wallet`
2. if `Create a wallet` is selected, we only show SSO options
3. if `I have a wallet` is selected, we only show web3 wallets.
4. the user can select from the displayed wallet or SSO options
5. if the user already has an account of the selected wallet or SSO option, then they will be signed in the app once auth process is complete
6. if the user didn't have an account of the selected wallet or SSO option, we open the welcome onboard modal once the auth process is complete
1. Assuming a user clicked on the `Signup` button, which opens the `Signin` modal
1. the user can select from any available wallet or SSO options
2. if the user already has an account of the selected wallet or SSO option, then they will be signed in the app once auth process is complete
3. if the user didn't have an account of the selected wallet or SSO option, we open the `Auth guidance modal` which looks like screenshot 1
4. From the `Auth guidance modal`
1. if `Create an account` is selected we display the `Create account modal`
2. if `Sign in another way` is selected we again display the `Signin` modal

image.png
