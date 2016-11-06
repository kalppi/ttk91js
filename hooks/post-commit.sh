echo 111

if git show --name-only --pretty= | grep 'ttk91js.*\.js'; then
	echo 222
	gulp build-dist
	echo 333
	git add dist/*
	echo 444
	git commit --no-verify -m "automatically generated distributions"
	echo 555
fi

echo 666