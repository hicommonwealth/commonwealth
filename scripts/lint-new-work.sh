LINES=$(git status --porcelain | grep "/*.ts" | sed 's/^...//' | tr '\n' ' ' | xargs ls -d 2>/dev/null)

if [ -z "$LINES" ]
then
    echo "There is nothing to lint"
else
    echo $LINES
    eslint $LINES
fi
