git stash -q --keep-index

npm test

RESULT=$?

if [ $RESULT -eq 0 ]; then
	gulp build-dist
	git add dist/*
fi

git stash pop -q

[ $RESULT -ne 0 ] && exit 1
exit 0