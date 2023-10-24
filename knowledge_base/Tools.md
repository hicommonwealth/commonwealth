_This entry serves as a bucket entry for documenting libraries and tools employed in the codebase._

**Contents**
- [Tools](#tools)
  * [Kong Gateway](#kong-gateway)
  * [Zod](#zod)
- [Change Log](#change-log)

# Tools

## Kong Gateway

Kong Gateway is an open-source API gateway and microservices management tool acting as an intermediary between clients and the app. 

To switch which URL Kong is gating, and alter the destination of incoming requests, navigate to Kong's Konnect Service Hub:

<img width="233" alt="Screenshot 2023-02-05 at 11 47 36 AM" src="https://user-images.githubusercontent.com/14794654/216841309-bde025ac-48d9-47be-ae47-44ba72b1760a.png">

Then navigate to the following gateway:

![Kong Gateway](./assets/Kong-Gateway-2.png)

...where you will be able to view the upstream URL. This setting determines the target server or service that Kong Gateway will direct incoming requests to.

![Kong Gateway](./assets/Kong-Gateway.png)

Set the "host" field to the Heroku server URL we want Kong to gate, e.g. `commonwealth-staging2.herokuapp.com`.

## Zod

As of 231024, we are moving toward Zod as a unified back- and frontend solution for schema validation. For legacy support reasons, external routes may present an exception, and continue using Express Validator instead.

For route validation, our current pattern is to `import z from 'zod'`, construct schemas via `z.object()`, and validate our request queries against these schemas using `schema.safeParse(req)`. The `safeParse()` method is used over `parse()`, which will throw an error if validation fails. Instead, if  the `safeParse` result (e.g. `validationResult`) `=== false`, we throw our own custom `AppError`.

# Change Log

- 231024: Updated with "Zod" entry by Graham Johnson
- 231024: "Kong" entry merged in by Graham Johnson.
- 230205: "Kong" entry authored by Kurtis Assad.