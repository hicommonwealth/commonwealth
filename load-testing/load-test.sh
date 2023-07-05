export SCRIPT_NAME=$(basename "$0")
export SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)

# if no SCRIPT_DIR make it .
if [[ -z "$SCRIPT_DIR" ]]; then
  export SCRIPT_DIR="."
fi

. ${SCRIPT_DIR}/env.sh
export REPORT_DIR=${SCRIPT_DIR}/$REPORT_DIR
mkdir -p ${SCRIPT_DIR}/$REPORT_DIR

set -x
yarn --cwd ${SCRIPT_DIR} test:load
yarn --cwd ${SCRIPT_DIR} test:report