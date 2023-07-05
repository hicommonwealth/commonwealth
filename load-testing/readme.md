# Load Testing with Artillery
https://www.artillery.io/docs/reference/engines/http

## Setup
```bash
yarn add artillery-plugin-ensure artillery-plugin-expect artillery-plugin-metrics-by-endpoint artillery-plugin-publish-metrics
```

## Start influx db & grafana
```bash
docker-compose up -d
```

## Artillery

### run
```bash
yarn artillery run test.yml
```

### visualize
```bash
yarn artillery report --output report.html report.json
```


## Run

### Pre-req load-test/env.sh
Create & populate env.sh by copying env.local.sh
Modify ENV to target different URL.
Make sure JWT token, USER_ADDRESS & POST_THREAD_ID are from same environment

### run local
```bash
sh load-test.sh
```

### run from root
```bash
yarn test-load
```

### Visualize
Visualize results in browser `load-testing/output/report-${ENV}.html`