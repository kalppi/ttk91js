git stash -q --keep-index

if git diff --name-only | grep 'ttk91js.*js'; then
	gulp build-dist
	git add dist/*
	git commit --no-verify -m "automatically generated distributions"
fi

git stash pop -q