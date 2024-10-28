---
date: "2016-12-11"
tags:
  - Python
  - virtual environment
title: Virtual environments with virtualenvwrapper
---

`virtualenvwrapper` is a set of shell functions built on top of the `virtualenv` python module, and make it even easier to create and manage python virtual environments.

The [documentation](https://virtualenvwrapper.readthedocs.io/en/latest/install.html) for this project is quite good, but here I wanted to write a reminder (mostly for me) about the configuration of this tool on a Linux server.

## Configuration

You can install `virtualenwrapper` with `pip`:

```shell
pip install virtualenvwrapper
```

Then you will need to create a (hidden) folder in your `home` directory and call it `.virtualenvs`.

Lastly, you will need to configure your terminal to execute `virtualenvwrapper` commands. This is done by adding 2 lines of code to a bash configuration file.

Here's the \*\*catch:

If you are working on your computer you have to add these 2 lines to your `~/.bashrc` file.

```shell
# ~/.bashrc (your local machine)
export WORKON_HOME=$HOME/.virtualenvs
source /usr/local/bin/virtualenvwrapper.sh
```

If you are working on a remote server via SSH you have to add the very same 2 lines, but in a different file, the `~/.bash_profile` file.

```shell
# ~/.bash_profile (your linux server)
export WORKON_HOME=$HOME/.virtualenvs
source /usr/local/bin/virtualenvwrapper.sh
```

Thanks to [this answer on askubuntu](https://askubuntu.com/a/121075) I found out that this difference is due to the different access modality:

* on your local machine you are accessing the console in interactive, non-login mode, and the `~/.bashrc` file will be sourced;
* on a remote server (e.g. a DigitalOcean droplet) via SSH you are accessing the console in interactive, login mode, and the `~/.bash_profile` file will be sourced.

If you want to know more about these bash files, see [here](https://stackoverflow.com/questions/415403/whats-the-difference-between-bashrc-bash-profile-and-environment).

## Hooks

If you are already using `virtualenv` you will probably know the `source bin/activate` command. This is a _hook_ that sets an environment variable called `VIRTUAL_ENV`, another one called `PYTHON_HOME` and a few others. The command `deactivate` is another hook that unset the same environment variables previously set.

`virtualenvwrapper` defines some additional hooks, like `postactivate` and `predeactivate`. You can use these hooks to set additional environment variables, set aliases, etc. See [here](https://gist.github.com/manuganji/9069466) for some examples that you might find useful.

## Most useful commands

Here are the most common `virtualenwrapper` commands:

```shell
mkvirtualenv YOUR_VIRTUALENV  # create virtual environment (and activate it)
mkvirtualenv YOUR_VIRTUALENV --python=python3.5  # create virtual environment and specify the python version
workon YOUR_VIRTUALENV  # activate virtual environment
rmvirtualenv YOUR_VIRTUALENV  # remove virtual environment
deactivate  # deactivate current active virtual environment
```
