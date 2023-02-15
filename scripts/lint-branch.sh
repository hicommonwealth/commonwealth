LINES=$(git diff master... --name-only --diff-filter=d | grep \\.ts)

if [ -z "$LINES" ]
then
    echo "There is nothing to lint"
else
    echo $LINES
    # "$@" allows you to pass eslint arguments to the yarn command like `yarn lint-branch --quiet`
    NODE_OPTIONS="--max-old-space-size=4096" eslint "$@" $LINES
fi
