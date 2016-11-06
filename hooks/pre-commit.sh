git stash -q --keep-index | grep 'No local change'
STASHED=$?

RESULT=0

if git diff --name-only --cached | grep 'ttk91js.*\.js'; then
	npm test
	RESULT=$?
fi


if [ $STASHED -eq 1 ]; then
	git stash pop -q
fi

[ $RESULT -ne 0 ] && exit 1
exit 0