To switch which url kong is gating, go into the services hub:
<img width="233" alt="Screenshot 2023-02-05 at 11 47 36 AM" src="https://user-images.githubusercontent.com/14794654/216841309-bde025ac-48d9-47be-ae47-44ba72b1760a.png">

Then go to this gateway:
![Kong Gateway](./assets/Kong-Gateway-2.png)

You will see the upstream url:
![Kong Gateway](./assets/Kong-Gateway.png)

Set the "host" field to the Heroku server URL we want kong to gate, e.g. `commonwealth-staging2.herokuapp.com`.

# Change Log

- 231012: Flagged by Graham Johnson: Could use more explicit clarity and context.
- 230205: Authored by Kurtis Assad.
