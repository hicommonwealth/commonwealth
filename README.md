# Scripts
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fhicommonwealth%2Fcommonwealth.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fhicommonwealth%2Fcommonwealth?ref=badge_shield)

- `yarn start-all`
  - Starts ALL the microservices in different processes. Requires a RabbitMQ instance/connection to function properly.
- `yarn start-apps`
  - Starts just the web-servers from all the microservices (currently just Commonwealth and Chain-Events)
  - This should be enough for most local front-end development
- `yarn start-rmq`
  - Starts a local RabbitMQ instance using Docker.
  - Run this in a separate terminal and pair it with the `yarn start-all` command to get a fully functional app.
- `yarn load-db [optional-dump-name]`
  - Loads the default `latest.dump` or the `optional-dump-name` into the database
  - Only available in the `commonwealth` and `chain-events` packages


## License
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fhicommonwealth%2Fcommonwealth.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fhicommonwealth%2Fcommonwealth?ref=badge_large)