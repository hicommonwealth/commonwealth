FROM datadog/agent:7

ENV DD_APM_ENABLED=false
ENV DD_APM_RECEIVER_PORT=0
ENV DD_APM_NON_LOCAL_TRAFFIC=false

ENV DD_LOGS_ENABLED=false
ENV DD_PROCESS_CONFIG_PROCESS_COLLECTION_ENABLED=false

ENV DD_USE_DOGSTATSD=true
ENV DD_DOGSTATSD_NON_LOCAL_TRAFFIC=true

COPY deploy/dockerfiles/datadog/rabbitmq.yaml /etc/datadog-agent/conf.d/rabbitmq.d/conf.yaml
COPY deploy/dockerfiles/datadog/redis.yaml /etc/datadog-agent/conf.d/redis.d/conf.yaml

ARG DD_API_KEY