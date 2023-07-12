export SCRIPT_NAME=$(basename "$0")
export SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)

if [[ -z "$SCRIPT_DIR" ]]; then
  export SCRIPT_DIR="."
fi

. ${SCRIPT_DIR}/env.sh
export REPORT_DIR=${SCRIPT_DIR}/$REPORT_DIR
mkdir -p ${SCRIPT_DIR}/$REPORT_DIR

echo "Running load test with the following environment variables:"
env | grep -E 'JWT|USER_ADDRESS|POST_THREAD_ID|ENV|REPORT_DIR|DD_SITE|TEST_LOCATION|TEST_ID|TEST_NAME'

node ${SCRIPT_DIR}/post-datadog-metrics.js &

set -x
yarn --cwd ${SCRIPT_DIR} test:load
yarn --cwd ${SCRIPT_DIR} test:report