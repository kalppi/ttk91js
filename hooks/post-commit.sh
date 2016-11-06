
if git diff --name-only --cached | grep 'ttk91js.*js'; then
	echo "Building distributions"
	
	gulp build-dist
	git add dist/*
	git commit --no-verify -m "automatically generated distributions"
fi
