---
date: "2017-08-07T20:12:03.284Z"
tags:
  - invoke
  - Python
  - virtual environment
title: Quickstart Python projects with Invoke
---

Every time I want to try out a new Python library or develop a small weekend project I need to create a git repository and configure a virtual environment. Most of the time I forget one passage or another and I end up losing a few minutes searching on Google how to perform some trivial task. Not fun.

Luckily, there are several tools to automate these boring, repetivive tasks. I know a little bit of [make](https://www.gnu.org/software/make/) and [Fabric](https://www.fabfile.org/), but I came across [Invoke](https://docs.pyinvoke.org/en/latest/index.html) and I wanted to try it.

I will show you how to automate the creation and the initial configuration of a basic Python project with Invoke.

According to the documentation, Invoke is a task execution tool & library that provides a clean, high level API for running shell commands and defining/organizing task functions from a `tasks.py` file. It's in a very early-stage development (version `0.20.3` at the time of this writing) but the documentation is pretty good.

I wanted to create a series of tasks – well, one basically – that could automate the process of:

1.  create a directory and initialize a git repository inside
2.  setup a virtual environment a few dependencies (pylint, flake8)
3.  configure the virtual environment for Visual Studio Code
4.  configure the virtual environment for PyCharm

I didn't manage to automate step 4, but the first three were fairly easy to deal with.

_Note: if you want to follow along, install invoke with `pip install invoke` and create a `tasks.py` file._

Let's start by importing invoke and defining a very simple task.

```python
from invoke import task

# location where I keep all of my repositories
REPOS = os.path.abspath(os.path.join(__file__, '..', '..'))

@task
def greet(ctx):
    print('Hi! I will create a new Project in {}...'.format(REPOS))
```

You can see that the function `greet` is decorated with the decorator `@task`, which makes it an `invoke` task. Every invoke task has a [Context](https://docs.pyinvoke.org/en/latest/api/context.html) and can be invoked from the terminal with:

```shell
invoke <task-name>
```

Let's create anothere simple task, and use the Context this time.

```python
@task
def message(ctx):
    msg = 'In PyCharm, setup the virtualenv for your project in:\n' \
          'Settings > Project > Project Interpreter > gear icon > Add Local' \
          '\nThe virtualenv should be located at:\n' \
          '~/.virtualenvs/<virtualenv created by pipenv>'
    ctx.run('echo {}'.format(msg))
```

The Context is the primary API endpoint, and encapsulates information about the state. As you can see, with Context.run you can run shell commands.

You can declare tasks to be executed before and/or after a task. You can also define a help for any particular task. If present, you can read the help message by typing `invoke <task-name> --help`.

Here is the task that I'm currently using when I want to start a new Python project.

```python
@task(
    pre=[greet],
    post=[message],
    help={
        'name': 'Name of the directory to create. A git repository will be '
                'initialized (default: my-repo)',
        'virtualenv': 'If True, use pipenv to create a Python 3.6 virtualenv '
                      'and lock the dependencies (default: False)'
    }
)
def mkrepo(ctx, name='my-repo', virtualenv=False):
    """Create git repo and make Initial Commit.

    Parameters
    ----------
    ctx : Context
    name : str
    virtualenv : bool

    Examples
    --------
    invoke mkrepo -n my-repo -v
    """
    repo_dir = os.path.join(REPOS, name)
    os.mkdir(repo_dir)
    _setup_git_repo(ctx, repo_dir)
    if virtualenv:
        _setup_pipenv(ctx, repo_dir)
```

All those underscores in front of the function's name are just there to remember the user that he should not call those functions directly.

The list of available tasks can be shown with these commands:

```shell
invoke --list  # or...
invoke -l
```

```shell
jack@ThinkJack:~/Repos/invoke-tasks(master)$ invoke -l
Available tasks:

  greet
  message
  mkrepo    Create git repo and make Initial Commit.
```

The task `mkrepo` calls a few functions. As you can see down here, these are just functions, not tasks, because I don't want to expose them to the invoke command-line interface. They still need a Context to run shell commands, so I need to pass the Context to them.

```python
def _setup_git_repo(ctx, repo_dir):
    """Initialize git repository and make Initial Commit.

    Parameters
    ----------
    ctx : Context
    repo_dir : str
    """
    cmd = """
    cd {} ;
    git init ;
    echo ".idea/" > .gitignore ;
    touch README.md ;
    git add . ;
    git commit -m "Initial Commit"
    """.format(repo_dir)
    ctx.run(cmd)
    os.mkdir(os.path.join(repo_dir, '.vscode'))
```

I recently started to use [Pipenv](https://www.giacomodebidda.com/posts/pipenv/). Here is a function to configure a Python virtual environment for a new project.

```python
def _setup_pipenv(ctx, repo_dir):
    """Create a python 3.6 virtual environment with pipenv, lock and commit.

    Parameters
    ----------
    ctx : Context
    repo_dir : str
    """
    cmd = 'cd {} ;' \
          'pipenv --python python3.6 ;' \
          'pipenv install --dev pylint ;' \
          'pipenv install --dev flake8 ;' \
          'pipenv lock'.format(repo_dir)
    ctx.run(cmd)
    cmd = 'cd {} ;' \
          'git add Pipfile Pipfile.lock ;' \
          'git commit -m "Lock dependencies"'.format(repo_dir)
    ctx.run(cmd)
    _create_python_module(ctx, repo_dir)
    _create_vscode_settings(ctx, repo_dir)
```

I also wanted to create a simple `example.py` file, just to save a few characters when I start writing code. That thing beginning with `<<EOF` and ending with `EOF` is a [Here Document](https://tldp.org/LDP/abs/html/here-docs.html).

```python
def _create_python_module(ctx, repo_dir):
    """Create a small python module.

    Parameters
    ----------
    ctx : Context
    repo_dir : str
    """
    pymodule_path = os.path.join(repo_dir, 'example.py')
    # create example.py with a Here Document
    cmd = """
    cat > {pymodule_path} <<EOF
def main():
    print('before breakpoint')
    print('place breakpoint here')


if __name__ == '__main__':
    main()
EOF
""".format(pymodule_path=pymodule_path)
    # in alternative, create a Here Document on a single line and use .format
    # to replace newlines and indentations
    # cat > {pymodule_path} <<EOF{newline}def main():{newline}{indent}print('example'){newline}EOF""".format(newline='\n', indent='    ', pymodule_path=pymodule_path)
    ctx.run(cmd)
```

I use Visual Studio Code a lot, so I want the path to the Python interpreter to be configured as soon as I start a new project. This can be done by create a `settings.json` for the **Workspace settings**.

```python
def _create_vscode_settings(ctx, repo_dir):
    """Create Workspace settings to use in Visual Studio Code.

    Parameters
    ----------
    ctx : Context
    repo_dir : str
    """
    cmd = 'cd {} ;' \
          'pipenv --venv'.format(repo_dir)
    result = ctx.run(cmd)

    # last character of stdout is a newline, so we strip it out
    venv_path = result.stdout[:-1]
    json_path = os.path.join(repo_dir, ".vscode", "settings.json")
    # create settings.json with a Here Document
    cmd = """
    cat > {json_path} <<EOF
{VS_CODE_SETTINGS_HERE}
EOF
""".format(json_path=json_path, venv_path=venv_path)
    ctx.run(cmd)
```

And replace `VS_CODE_SETTINGS_HERE` with something like this:

```json
{
    "editor.rulers": [80, 100],
    "python.pythonPath": "{venv_path}"
}
```

_Note: Oviously you don't need to set the `editor.rules`, but since I use it in all of my projects I decided to include it._

## Conclusion

With Invoke you can also execute shell commands with `sudo`, create [namespaces](https://docs.pyinvoke.org/en/latest/concepts/namespaces.html) and use a [MockContext](https://docs.pyinvoke.org/en/latest/concepts/testing.html#use-mockcontext). I didn't need these features this time, but I think I will try them for more complex tasks. I really liked the clean API and the easy of use of Invoke.
