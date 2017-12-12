printf "Running pre-commit hook!\n\n"

git fetch

src_dir='beeline/*.js'
diff_filenames=$(git diff --name-only --cached origin/master -- $src_dir)

if [ -z "$diff_filenames" ]
then 
  printf "No file changes detected"
else
  printf "Running prettier and eslint on the following JS files in this branch...\n"
  printf "%b\n" "$diff_filenames"
  printf "\n"

  prettier_diff=$(./node_modules/prettier/bin/prettier.js --list-different $diff_filenames)

  if [ -z "$prettier_diff" ]
  then
    printf "No changes after running prettier"
  else
    printf "Running prettier on the following files:\n"
    ./node_modules/prettier/bin/prettier.js --write $prettier_diff

    # printf "\nPrettier has made some changes to your files.\n"
    # printf "Do you want to commit those changes? (Y/N) "
    # read auto_commit_prettier

    # if [ -z "$auto_commit_prettier" ] || [ "$auto_commit_prettier" == "Y" ] || [ "$auto_commit_prettier" == "y" ];
    # then
    #   for file in $prettier_diff; do
    #     git add $file
    #   done
    # fi
  fi

  printf "\nRunning ESLint with --fix option...\n"
  # printf "Do you want to commit those changes? (Y/N) "
  # read auto_commit_eslint

  # Detect if eslint can autofix
  ./node_modules/eslint/bin/eslint.js --fix $diff_filenames

  # for file in $prettier_diff; do
  #   git add $file
  # done
fi
