---
date: "2020-09-18T12:00:00.000Z"
description: Here is how I (re)configure my laptop with Ansible
tags:
  - Ansible
  - DevOps
title: How I setup my laptop with Ansible
---
I've recently started using Ansible to configure my laptop. Having a development machine setup with a couple of command is pretty great, but there are still some manual steps I need to take care in the process.

Here is what I do every time I (re)configure my laptop.

## Preliminary operations

1. Create a bootable USB stick for my Linux distro of choice, Xubuntu 20.04 (see step 0 below).
2. Save all my SSH keys and config files on a USB stick or external hard disk.
3. Print the backup 2FA codes for my password manager (Lastpass).
4. Export the feedlist from my RSS reader (Liferea).
5. Check that I can connect to a WiFi network.

## 0 - Create a bootable USB stick for a Linux distro

There are many articles that explain how to do it, but I think they are way too verbose. Here is how I do it:

1. Download the ISO of your Linux distro of choice.
2. Find a 8GB USB stick and format it with GParted. Choose a FAT32 file system. In alternative, you can format it from the terminal using `fdisk` and `mkfs` (see [this tutorial](https://www.redips.net/linux/create-fat32-usb-drive/)), but in my opinion GParted is way easier and faster.
3. Check the device name that your system assigned to the USB stick. You can use either `lsblk` or `sudo fdisk -l` to find it out. Let's say it's `/dev/sda`
4. Use `ddrescue` to write the ISO to the USB stick. This should take ~5 minutes.

Here is how I wrote a bootable Xubuntu 20.04 USB stick with `ddrescue`:

```shell
sudo ddrescue xubuntu-20.04-desktop-amd64.iso /dev/sda --force -D
```

## 1 - Install Xubuntu with full-disk encryption

As far as I know, Full Disk Encryption is the single most important thing you can do to ensure your peace of mind. You need LVM (Logical Volume Management) to use it, and you have to encrypt the disk when you install a new system. You can't do it later.

## 2 - Install GIT and GNU Stow

I don't know why, but Ubuntu doesn't come with git already installed. [GNU Stow](https://www.gnu.org/software/stow/) is a program I use to symlink my dotfiles from a git repo to my home directory.

```shell
sudo apt install -y git stow
```

## 3 - Clone my dotfiles repo with HTTPS

I keep all my git repos in a single directory.

```shell
mkdir ~/repos
```

I can't yet clone a git repo via SSH because I haven't copied the SSH keys, so I use HTTPS for now.

```shell
git clone https://github.com/jackdbd/dotfiles.git
```

## 4 - setup bash

I keep my bash files (`.bashrc`, `.bash_logout`, `bash_aliases`) in [my dotfiles repo](https://github.com/jackdbd/dotfiles), so I remove the ones that come with the distro:

```shell
rm ~/.bashrc
rm ~/.bash_logout
```

I create symlinks from the dotfiles in `mkdir ~/repos/dotfiles/bash` to `~` with Stow.

```shell
cd ~/repos/dotfiles/bash
stow . --target ~
```

## 5 - setup SSH

I keep some of my SSH config files—obviously neither the SSH keys nor the config files for private servers—in my dotfiles repo.

Here is how I create the symlinks with Stow.

```shell
cd ~/repos/dotfiles/ssh
stow . —target ~
```

I can now copy my SSH keys from an USB stick. It's going to be something like this:

```shell
cp -r /media/jack/PATH-TO-SSH-KEYS-ON-USB-STICK/ ~/.ssh
```

If I now try to connect to one of my remote servers with SSH, the SSH agent would probably complain and give me a permission denied error. This is because the file permissions for the SSH keys are too open. To fix this, I change the file permissions to be read-only.

```shell
chmod 400 ~/.ssh/keys/*
chmod 400 ~/.ssh/conf.d/*
chmod 400 ~/.ssh/config
```

I then need to add the SSH keys to ssh-agent, the program that keeps track of user's identity keys and passphrases. The command for that is simply `ssh-add PATH-TO-SSH-KEY`, but I don't type it because I keep it in my `.bashrc`. So all I have to do is this:

```shell
source ~.bashrc
```

I can now test that I can connect to remote services using the aliases I defined in my SSH config.

```shell
ssh github
ssh gitlab
# etc
```

## 6 - Clone my ansible-laptop repo with HTTPS

At this point I still haven't installed the password manager extension (Lastpass) for my favorite browser (Chromium), so I can't yet use SSH to clone a git repo from Github (because I use a super long password for Github and I don't remember it). So I use HTTPS once again:

```shell
cd ~/repos
git clone https://github.com/jackdbd/ansible-laptop.git
cd ~/repos/ansible-laptop
```

## 7 - Install Ansible

There are several ways to install Ansible on Ubuntu-based distros. I do as they say in the [official documentation](https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html#installing-ansible-on-ubuntu):

```shell
sudo apt update
sudo apt install software-properties-common
sudo apt-add-repository --yes --update ppa:ansible/ansible
sudo apt install ansible
```

## 8 - Install all the things!

Some of the tools I install with Ansible are just binaries. I need to place them in a single directory so I can add them all to my `$PATH`.

```shell
mkdir ~/bin
```

Finally I can setup my laptop with the configuration I keep in my [ansible-laptop](https://github.com/jackdbd/ansible-laptop) repo. I need two commands for this: `ansible-galaxy` and `ansible-playbook`.

I use a couple of Ansible roles from [Ansible Galaxy](https://galaxy.ansible.com/docs/). If you don't know Ansible Galaxy, it's a public repository for Ansible roles. Think of Docker Hub but for Ansible. I install [java](https://galaxy.ansible.com/geerlingguy/java) and [docker](https://galaxy.ansible.com/geerlingguy/docker) this way.

```shell
ansible-galaxy install -r requirements.yml
```

All other software I need is configured in my Ansible playbook, that I run with this command:

```shell
ansible-playbook playbook.yml -K
```

*Note*: I use [Nerd Fonts](https://www.nerdfonts.com/) to install custom fonts on my machine. At the moment I'm cloning the entire repo, which is probably way too many fonts I will ever need. Since cloning the entire repo takes a long time, you might want to skip it if you are in a hurry. You can do it with `--skip-tags`.

```shell
ansible-playbook playbook.yml -K --skip-tags "fonts"
```

## 9 - Install Lastpass on Chromium

I use a bunch of browser extensions, and I keep them synced across devices. So just I install Lastpass and sync all the other extensions.

## 10 - Re-clone my dotfiles and ansible-laptop repos via SSH

Now that I can login to my Github account with Lastpass and that I can connect via SSH, I re-clone my repos with SSH. This way I don't have to type my password every time I pull from a git remote or push code to it.
