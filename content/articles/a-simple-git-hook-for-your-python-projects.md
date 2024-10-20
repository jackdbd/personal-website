---
date: "2017-09-10T21:30:03.284Z"
tags:
  - git
title: A simple git hook for your Python projects
---

A [git hook](https://githooks.com/) is a script that git executes before or after a relevant git event or action is triggered. The hooks are stored in the `.git/hooks` directory of your repository, which is created automatically when you run `git init`.

Git hooks can be really useful to enforce a certain policy on your commits, push your changes to a continuous integration server, or automatically deploy your code.

I wanted to enforce a very simple policy for my commits: _no broken code should be deployed on the master branch_. So I wrote this small `pre-commit` hook:

```shell
#!/bin/sh
current_branch=`git branch | grep '*' | sed 's/* //'`

if [ "$current_branch" = "master" ]; then
    echo "You are about to commit on master. I will run your tests first..."
    python -m unittest discover tests
    if [ $? -eq 0 ]; then
        # tests passed, proceed to prepare commit message
        exit 0
    else
        # some tests failed, prevent from committing broken code on master
        echo "Some tests failed. You are not allowed to commit broken code on master! Aborting the commit."
        echo "Note: you can still commit broken code on feature branches"
        exit 1
    fi
fi
```

It's a simple _client side hook_ that runs all of my Python tests before committing on `master`. I can still create a feature branch and commit broken code on that, but as soon as I try to merge the feature branch into master, all test run. If any of the tests fails I can't commit. Simple as that.

Git hooks are language agnostic. I wrote this small hook as a shell script, but you can use other languages liek Perl, Ruby or Python. [Here](https://github.com/bahattincinic/python-git-hook/blob/master/pre-commit) is an example of a `pre-commit` hook in written in Python.
