To switch which url kong is gating, go into the services hub:
<img width="233" alt="Screenshot 2023-02-05 at 11 47 36 AM" src="https://user-images.githubusercontent.com/14794654/216841309-bde025ac-48d9-47be-ae47-44ba72b1760a.png">


Then go to this gateway:

<img width="1115" alt="Screenshot 2023-02-05 at 11 47 53 AM" src="https://user-images.githubusercontent.com/14794654/216841324-ecafcaac-f375-41de-9397-fc55b6186707.png">


You will see the upstream url
<img width="1189" alt="Screenshot 2023-02-05 at 11 48 17 AM" src="https://user-images.githubusercontent.com/14794654/216841350-6c444a78-d199-4ef8-b3e0-467ba9433cc5.png">
Change it to the heroku server url that is being hosted on the url which we want kong to gate:
<img width="985" alt="Screenshot 2023-02-05 at 11 49 07 AM" src="https://user-images.githubusercontent.com/14794654/216841396-8fc8b850-ca72-4cd4-8919-c51cb5266df1.png">
