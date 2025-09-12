# 1. Can you provide an overview of how the notifications system works end-to-end?

Mobile app notifications in uses Expo inside the mobile app and receive user id 
information from the frontend.

The entire system just uses the Knock mobile SDK, however, the main obstacle 
is how do we get uid information into react-native.

To accomplish that, the frontend uses the React Native Bridge, AKA 
ReactNativeWebView to push the uid into the client.  

Once the client has the uid it can register notifications with Knock.

One issue though is requesting permissions.  To do that, we have a service 
inside react-native that listens for the request from the client, then requests
permissions on behalf of the user who requested it from the Webview.

# 2. How does the creation, editing, and deletion of notifications currently work (e.g. through code, CMS, API)?

That all happens inside the server env.  Not on the frontend.

The frontend triggers events, then the events trigger the notification flow.

# 3. Are there any key files or components to be aware of when working with notifications?

Honestly, the best strategy is to search for 'notification' in the mobile app.

There are only 4-5 files.  The mobile app code is pretty lightweight.

# 4. Is there any scheduled or recurring notifications support? How are those managed?

Those would be handled in Knock. The mobile app is pretty simple.

# 5. Are push notifications and in-app notifications handled via the same lib?

Yes.  Both by Knock. 

The in-app notifications are using an embedded Knock UI driven by React.

The push notifications use the react-native implementation of Knock in the mobile
app.

