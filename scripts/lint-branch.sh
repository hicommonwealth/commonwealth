LINES=$(git diff master... --name-only --diff-filter=d | grep \\.ts)

if [ -z "$LINES" ]
then
    echo "There is nothing to lint"
else
    echo $LINES
    NODE_OPTIONS="--max-old-space-size=4096" eslint $LINES
fi
