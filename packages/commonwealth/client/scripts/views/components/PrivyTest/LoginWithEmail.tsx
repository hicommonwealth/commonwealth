import {
  useIdentityToken,
  useLoginWithEmail,
  usePrivy,
  useSignMessage,
  useWallets,
} from '@privy-io/react-auth';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSignIn } from 'state/api/user';

// function useMemoizedFunction<Input, Output>(
//   delegate: (input: Input) => Output,
// ): (input: Input) => Output {
//   const delegateRef = useRef(delegate);
//   delegateRef.current = delegate;
//
//   return useCallback((input) => {
//     return delegateRef.current(input);
//   }, []);
// }

function useMemoizedFunction<Args extends any[], Output>(
  delegate: (...args: Args) => Output,
): (...args: Args) => Output {
  const delegateRef = useRef(delegate);
  delegateRef.current = delegate;

  return useCallback((...args: Args) => {
    return delegateRef.current(...args);
  }, []);
}
function useSignMessageMemo() {
  const { signMessage } = useSignMessage();
  return useMemoizedFunction(signMessage);
}

export const LoginWithEmail = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const { authenticated, user, logout, createWallet } = usePrivy();
  const wallets = useWallets();
  const identityToken = useIdentityToken();
  const { signIn } = useSignIn();

  const signMessage = useSignMessageMemo();

  useEffect(() => {
    async function doAsync() {
      // if (authenticated) {
      //   const uiOptions = {
      //     title: 'You are voting for foobar project',
      //   };
      //   await signMessage({ message: 'hello world' }, { uiOptions });
      // }
      // if (wallets.wallets && wallets.wallets.length > 0) {
      //   console.log('FIXME GOT A WALLET');
      //   console.log('FIXME: Getting ethereum provider....');
      //   const wallet = wallets.wallets[0];
      //
      //   const uiOptions = {
      //     title: 'You are voting for foobar project',
      //   };
      //
      //   //
      //
      //   // FIXME this triggers the useEffect...
      //   await signMessage({ message: 'hello world' }, { uiOptions });
      //
      //   // console.log('FIXME: wallet: ', wallet);
      //   // const ethereumProvider = await wallet.getEthereumProvider();
      //   // console.log('FIXME: ethereumProvider: ', ethereumProvider);
      //   // const webWallet = new GenericEthereumWebWalletController(
      //   //   () => ethereumProvider,
      //   // );
      //   // await webWallet.enable();
      //
      //   // TODO: get an embedded wallet... verify it is embedded?
      //   // FIXME: signMessage is being called.
      //   // const session = await getSessionFromWallet(webWallet, {
      //   //   newSession: true,
      //   // });
      //   //
      //   // await signIn(session, {
      //   //   address: wallet.address,
      //   //   community_id: ChainBase.Ethereum,
      //   //   wallet_id: WalletId.Privy,
      //   // });
      //   //
      //   // console.log('FIXME: session: ', session);
      // } else {
      //   console.log('FIXME: No wallets... ', {
      //     wallets,
      //   });
      //   //await createWallet();
      // }
    }

    doAsync().catch(console.error);
  }, [authenticated]);

  // call the MAIN signIn hook...

  // FIXME: signIn needs
  // address_id which is wallet.address
  // community_id - just use the 'Etherium' community ID to start
  // wallet_id: WalletId.Privy
  // FIXME: now I have to get the session ID...
  // const session = await getSessionFromWallet(wallet, { newSession: true });
  // this just calls await sessionSigner.newSession(CANVAS_TOPIC);

  // TODO: in order to sign we have to call this...
  // const {signMessage} = useSignMessage();

  // I have to create a new SessionSigner from it...

  const handleSendCode = useCallback(() => {
    // FIXME: ... I get Captcha failed - but no captcha is shown.
    async function doAsync() {
      console.log('Sending code to email: ' + email);
      await sendCode({ email });
      console.log('Code sent');
    }

    doAsync().catch(console.error);
  }, [email, sendCode]);

  const handleCode = useCallback(() => {
    async function doAsync() {
      await loginWithCode({ code });
      console.log('Authenticated now?');
    }

    doAsync().catch(console.error);
  }, [code, loginWithCode]);

  const handleSignMessage = useCallback(() => {
    async function doAsync() {
      if (authenticated) {
        const uiOptions = {
          title: 'You are voting for foobar project',
        };
        const { signature } = await signMessage(
          { message: 'hello world' },
          { uiOptions },
        );
        console.log('FIXME: signature: ', signature);
      } else {
        console.log('FIXME: Not authenticated');
      }
    }

    doAsync().catch(console.error);
  }, [authenticated, signMessage]);

  if (authenticated) {
    return (
      <div>
        Welcome, {user?.email?.address}
        <div>
          <button onClick={logout}>Logout</button>

          <button onClick={handleSignMessage}>Sign Message</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <input onChange={(e) => setEmail(e.currentTarget.value)} value={email} />
      <button onClick={() => handleSendCode()}>Send Code</button>
      <input onChange={(e) => setCode(e.currentTarget.value)} value={code} />
      <button onClick={() => handleCode()}>Login</button>
    </div>
  );
};
