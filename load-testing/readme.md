# Load Testing with Artillery
https://github.com/artilleryio/artillery
https://www.artillery.io/docs/reference/engines/http


### Pre-req load-test
create .env based on env.local.sh
```bash
yarn install
```

### run local
```bash
yarn test:local
```

### run aws
`TEST_LOCATION` should be valid aws region
Supported Regions: us-east-1, us-west-1, eu-west-1, eu-central-1, ap-south-1, ap-northeast-1

```bash
yarn test:aws
```

Unfortunately `ap-south-1` didnt work for me
```
    stoppedReason: 'CannotPullContainerError: pull image manifest has been retried 1 time(s): failed to resolve ref 301676560329.dkr.ecr.ap-south-1.amazonaws.com/artillery-pro/aws-ecs-node:v2-1f676ad7a2ecc923e813cdc7ac1bf4a2328daec0: 301676560329.dkr.ecr.ap-south-1.amazonaws.com/artillery-pro/aws-ecs-node:v2-1f676ad7a2ecc923e813cdc7ac1bf4a2328daec0: not found',
```

### Visualize
Visualize results in browser `load-testing/output/report-${ENV}.html`

## Artillery Basics

### run
```bash
yarn artillery run test.yml
```

### visualize
```bash
yarn artillery report --output report.html report.json
```

## Extras
### Start influx db & grafana
```bash
docker-compose up -d
```