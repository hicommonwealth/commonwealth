# Exit immediately if a command exits with a non-zero status.
set -e

# build
if [ "$SL_BUILD" = true ]; then
  yarn workspace snapshot-listener build
elif [ "$DL_BUILD" = true ]; then
  yarn workspace discord-bot build
else
  exit 2
fi
