if git show --name-only --pretty= | grep 'ttk91js.*\.js'; then
	gulp build-dist
	git add dist/*
	git commit --no-verify -m "automatically generated distributions"
fi