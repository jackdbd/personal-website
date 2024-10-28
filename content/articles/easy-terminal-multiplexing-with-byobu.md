---
date: "2019-03-20"
ogp:
  image: https://res.cloudinary.com/jackdbd/image/upload/v1599302017/byobu-screenshot_sbkhm6.png
  imageAlt: A screenshot of my Linux terminal when using Byobu.
  video: "https://youtu.be/NawuGmcvKus"
tags:
  - CLI
title: Easy terminal multiplexing with Byobu
---

I spend a lot of time in the linux terminal, because it's usually the fastest and most effective way to perform a task.

On average I use the terminal to navigate the file system, launch both a backend server and a frontend server, and commit code with git.

One obvious way to perform many tasks is to open many terminal windows. But then, switching between them with `Alt + Tab` on my Xubuntu system gets tedious pretty fast.

Another option, if you use VS code like me, is to open several terminal windows and perform your tasks there. The problem is that I often work with a 13.3' laptop, and I don't have that much screen real estate to throw away.

A better alternative is to use a terminal multiplexer like [tmux](https://github.com/tmux/tmux/wiki) or [GNU Screen](https://en.wikipedia.org/wiki/GNU_Screen).

I tried tmux a couple of times, but it didn't really stick with me. I watched a few videos from [this YouTube playlist](https://www.youtube.com/watch?v=ZNM1KfqpyGo&t=5s&list=PL5BE1545D8486D66D&index=2), but in the end I didn't invest enough time to learn it properly.

A colleague at [work](https://www.develer.com/) recommended me [Byobu](https://help.ubuntu.com/community/Byobu), so I decided to try it out.

https://res.cloudinary.com/jackdbd/image/upload/v1599302017/byobu-screenshot_sbkhm6.png

## Installation and first steps

Byobu is a script that launches either tmux (default) or GNU screen. You can install it with `sudo apt-get install byobu` and launch it with `byobu`.

If you want to see Byobu in action and learn a few basic commands, I think your best option is to watch the 10-minute tutorial by its author:

https://www.youtube.com/watch?v=NawuGmcvKus&ab_channel=DustinKirkland

## Keybindings I use all the time

I am sure I will keep using Byobu and maybe configure some custom keybindings in the future. For now I use these ones:

- `Shift + F1`: show all Byobu's keybindings (press `q` to exit).
- `Shift + F2`: split the current panel vertically.
- `Ctrl + F2`: split the current panel horizontally. *Note* Xubuntu's Window Manager has already a keybinding for this key combination: `Move to Workspace 2`. Since I don't use workspaces, I disabled the keybinding in Window Manager.
- `Shift + arrow (LEFT/RIGHT/UP/DOWN)`: switch between panels.
- `Shift + Alt + arrow (LEFT/RIGHT/UP/DOWN)`: resize panel.
- `F7`: enter *scrollback* mode. You can navigate past output using *vi-like* commands, like see [here](https://help.ubuntu.com/lts/serverguide/byobu.html). Exit with `Enter`.
- `Alt + PageUp/PageDown`: scroll back/forward.

When you type `exit`, Byobu closes the current panel and resizes all other panels in the terminal window.
