
# Privy

Auth is handled by Privy which provides a bridge between react-native and our
webapp.

Privy, inside react-native, performs auth on the react-native side, then, once
that's done, it uses the RPC system to bridge function calls from the webview
into Privy running inside react-native.

The mains ones are signMessage, which handles auth, the other one is eth_call
which is handled in PrivyWalletController in the webapp.

# What’s the current status of the Privy migration? What has already been completed?

Privy on the frontend works with all oauth providers shown in the UI.

The privy oauth system is generic in that if the provider is configured in 
Privy, it will/should work when triggered in the UI.

# What tasks are still pending to fully complete the migration?

There is a #privy label in Github which includes all issues. 

Email, SMS, and oauth all work. I think the next major steps involve 

# Does the Privy integration currently work on pre-production environments? If not, what’s blocking it?

Everything works on Frack.

If you guys are happy with how it works you just have to change the .env to 
enable Privy.

# Are there any environment variables or secrets specific to Privy integration?

Yes.  Sent via DM.

# How is the distinction between mobile and desktop handled with Privy (e.g. auth flows, UI logic)?

The webapp uses the full privy SDK for the regular React web SDK.

It works in the desktop app and regular web browsers.

The mobile-app uses the Privy react-native SDK which uses an RPC system for
communicating with React via a react-native mobile interface.  The Privy 
react-native SDK handles the auth and forwards it into the web UI.

# Were any trade-offs or limitations discovered during the integration? I recall we had some internal lib problems?

The React web SDK doesn't memoize the objects returned. 

That and our tRPC system has the same problem. 

I had to hack some things to useMemo to void this problem so that we didn't 
get into React render storms.

I'm not happy with the code in that regard but it's the only way we could get it 
working.

The react-native SDK seems pretty solid though.

# Was any custom logic added to extend or patch Privy's behavior?

I think everything is standard except for the wrappers around useMemo and useRef
to avoid the memoization bugs with Privy.

# Did we implement or started work on wallet support with privy or only sso's related work was done?

Privy creates a default wallet for each user.  That's already done.

We also have a URL to export the wallet from a user that's authenticated in Magic.
