git stash -q --keep-index

RESULT="0"

if git diff --name-only | grep 'ttk91js.*js'; then
	npm test
	RESULT=$?
fi

if $RESULT -eq 0; then
	gulp build-dist
	git add dist/*
fi

git stash pop -q

[ $RESULT -ne 0 ] && exit 1
exit 0