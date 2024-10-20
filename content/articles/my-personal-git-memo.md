---
date: "2017-07-20T16:30:03.284Z"
tags:
  - git
title: My personal Git Memo
---

Here is an unordered list of git commands, configurations, tricks, articles, gotchas that I don't want to forget.

* Find out all commit hashes of the git submodules your branch is pointing at
* Find commit by message string
* Show all commits from an author, in a specified date range
* Fix `.git/index.lock` error
* Permanently remove a file from a repo
* Show branch name in Linux terminal
* Compare a file across 2 branches
* List all commits for a specific file
* Configure git aliases
* Commit only part of a file
* Git hooks
* Discard changes to git submodules

---

## Find out all commit hashes of the git submodules your branch is pointing at

```shell
git ls-tree <branch you are currently on>:<path to directory containing the submodules>
```

_Example_

```shell
git ls-tree master:external
```

Reference [here](https://stackoverflow.com/a/5033973)

## Find commit by message string

```shell
git log --all --grep="your commit message here (or part of it)"
```

Use `--all` to search across all branches. Don't use it if you want to restrict the search to the branch you are currently on.

Reference [here](https://stackoverflow.com/a/7124949)

## Show all commits from an author, in a specified date range

```shell
git log --pretty=format:"%ad - %an: %s" --after="2016-01-31" --until="2017-12-01" --author="John Doe"
```

Reference [here](https://stackoverflow.com/a/42795304/3036129) and [here](https://git-scm.com/book/it/v2/Git-Basics-Viewing-the-Commit-History)

## Fix `.git/index.lock`

I get this from time to time, and I still haven't figured out the reason why it occurs.
You just have to remove the `index.lock` file (not the index!).

```shell
rm .git/index.lock
```

Reference [here](https://thoughtbot.com/blog/how-to-fix-rm-f-git-index)

## Permanently remove a file from a repo

You should really think twice before performing this operation. Also, keep in mind that this command will override git history.

Anyway, there are some real use cases when this command is useful.

Let's say that you commit a large file by mistake. You have some stuff to commit and you run a convenient `git add .` to stash all your changes. Then you forget to review your changes and those changes end up in the commit history. At this point you are still on a local branch, so you can still save the day by removing the file, stashing your changes once again and running a `git commit --amend`. If you realize your mistake some commits later, but you have not yet pushed them, you can also [squash your commits](https://www.giacomodebidda.com/squashing-git-commits/). But if you have already pushed to your remote repository you are out of luck, and that's when this command could help you.

Let's suppose that at some point in time you created a `README.md` for your project, but for some esoteric reason you want to remove it from your project. You can permanently remove your `README.md` file and make it disappear from your git history with the following command.

```shell
git filter-branch --tree-filter 'rm -rf README.md' HEAD
```

If you now run `git status`, you will notice that your local branch and your remote branch differ. That's because your remote branch still has a `README.md` in its history.

```shell
jack@ThinkJack:~/Repos/d3-visualizations(master)$ git status
On branch master
Your branch and 'origin/master' have diverged,
and have 26 and 26 different commits each, respectively.
  (use "git pull" to merge the remote branch into yours)
```

Now you have to push your changes to the remote repo. You have to use `--force`, since this is not a fast-forward commit and you have to rewrite the history of the remote repo.

```shell
git push origin master --force
```

Reference [here](https://dalibornasevic.com/posts/2-permanently-remove-files-and-folders-from-a-git-repository)

## Show branch name in Linux terminal

For this, you have to edit your `.bashrc` file. It should be in your `home` directory.

```shell
parse_git_branch() {
 git branch 2> /dev/null | sed -e '/^[^*]/d' -e 's/* \(.*\)/(\1)/'
}
if [ "$color_prompt" = yes ]; then
 PS1='${debian_chroot:+($debian_chroot)}\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[01;31m\]$(parse_git_branch)\[\033[00m\]\$ '
else
 PS1='${debian_chroot:+($debian_chroot)}\u@\h:\w$(parse_git_branch)\$ '
fi
unset color_prompt force_color_prompt
```

Reference [here](https://www.leaseweb.com/labs/2013/08/git-tip-show-your-branch-name-on-the-linux-prompt/)

## Compare a file across 2 branches

```shell
git difftool <target branch> -- <your file>
```

For example, if you are on `master` and want to check a file on your `release-01.03.02` branch, run:

```shell
git difftool release-01.03.02 -- src/js/index.js
```

Reference [here](https://stackoverflow.com/a/4099805/3036129), and if your file has a different name in 2 different branches, see [here](https://stackoverflow.com/a/8131164/3036129).

## List all commits for a specific file

```shell
git log --follow filename
```

Reference [here](https://stackoverflow.com/a/8808453/3036129)

Configure Git aliases
You can use `git config` to create your aliases, but there is a faster way.
Add (or edit) the `alias` section of your `.gitconfig` file. It should be in your `home` directory.

These is the `alias` section in my `.gitconfig`.

```shell
[alias]
    st = status
    au = add -u
    dt = difftool
    cm = commit -m
    cma = commit --amend  --no-edit
    co = checkout
    # list aliases https://gist.github.com/mwhite/6887990
    la = "!git config -l | grep alias | cut -c 7-"
```

For some other Git aliases, see [this wiki](https://git.wiki.kernel.org/index.php/Aliases).

Reference [here](https://gist.github.com/mwhite/6887990) and [here](https://git-scm.com/book/it/v2/Git-Basics-Git-Aliases)

## Commit only part of a file

You can use `git gui` for this. If you don't have it already, install it with `sudo apt-get install git-gui`. Here is what I usually do:

1.  `git gui`
2.  right click on the code you want to commit and select `stage lines for commit` (or `stage hunk for commit`)
3.  `git stash`, to save in the stash all changes that I am not committing right now
4.  `git commit`
5.  `git stash apply`
6.  `git stash drop`

If you like (I personally don't), you can replace

```shell
git stash apply
git stash drop
```

with

```shell
git stash pop
```

Reference [here](https://stackoverflow.com/a/16137932).

In alternative to `git gui`, you can use [interactive staging from the terminal](https://git-scm.com/book/en/v2/Git-Tools-Interactive-Staging). I have never tried this.

## Git hooks

I am not an expert on hooks in Git, but I found this really [nice article about them](https://blog.ittybittyapps.com/blog/2013/09/03/git-pre-push/).

I think the most useful hooks are

* pre-push
* prepare-commit-msg
* post-commit

It would be nice to have a pre-merge hook, so we could prevent a feature branch from merging into master if certain conditions are not met (e.g. your tests fail). Since a pre-merge hook is not available, you'll have to [write it]((https://stackoverflow.com/questions/19102714/how-would-i-write-a-pre-merge-hook-in-git).

Reference [here](https://www.atlassian.com/git/tutorials/git-hooks).

## Discard changes to Git submodules

I think it happened only once to me, but I had to reset all submodules with this line:

```shell
git submodule foreach git reset --hard
```

Reference [here](https://kalyanchakravarthy.net/blog/git-discard-submodule-changes/).
