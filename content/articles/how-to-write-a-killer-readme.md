---
date: "2017-07-29T19:12:03.284Z"
tags:
  - documentation
title: How to write a killer README
---

A README file is the first thing that someone encounters when he finds your project. It's a public-facing measure of your work, so it's definitely a good idea to spend some time reading articles and guidelines about how to write it well. Other developers and your future self will thank you for a well-crafted README.

> For every hour of code you write, spend an hour writing your README.
>
> — [Richard Kim](https://blog.cwrichardkim.com/how-to-get-hundreds-of-stars-on-your-github-project-345b065e20a2)

There are many great resources about how to write a good README. Here I will summarize what I learned and add my perspective.

I think that most articles miss the point that for different project _types_ you need to structure the README in a different way, and to include different type of information.

I can think about the following project types:

* library or tool
* project starter or project clone
* cookbook repository
* list of articles or resources on a topic

I will try to describe, including some examples for each category, how a good README looks like.

## Library or tool

Stephen Whitmore, author of [The Art of README](https://github.com/noffle/art-of-readme), and Ken Williams, a PERL developer, say that a README is an _abstraction_ for your project:

> Your documentation is complete when someone can use your module without ever having to look at its code. This is very important. This makes it possible for you to separate your module's documented interface from its internal implementation (guts). This is good because it means that you are free to change the module's internals as long as the interface remains the same.
>
> Remember: the documentation, not the code, defines what a module does.
>
> — Ken Williams

Tom Preston Warner even suggests to [writing the README first](https://tom.preston-werner.com/2010/08/23/readme-driven-development.html). I have never tried, but Tom's reasons are very well sound: writing a README first gives you clarity about what you actually want to build, and lets you avoid some pitfalls when you start writing code.

A developer who reads your README should be able to answer these questions:

1.  Does it solve my problem?
2.  Can I use this code?
3.  Can I trust this code?

Let's see how you can answer each one of these.

#### Does it solve my problem?

Ideally, your project name should be self-explanatory, and your project description should be a one-liner. You have to showing what your project is all about. Answer this question first, so if a developer discovers that your project is not what he needs, he can quickly move on. Write an Introduction and a Usage section to answer this question.

> [The Introduction] should be a few sentences that explain exactly what the purpose of the code is, why someone would want to use it, and how it works. Answer the what, why, and the how.
>
> — [Eric L. Barnes](https://m.dotdev.co/how-to-write-a-readme-that-rocks-bc29f279611a)

Have a look at the README of [Pipenv](https://github.com/kennethreitz/pipenv). In half a page you can see a short description, an animated GIF, a list of features and user testimonials. In a few seconds you can understand if this is something that you may want to use or not.

Everyone loves animated GIFs, and I think they are far superior to screenshots when it comes to show your project in action. If it's applicable to your project, include an animated GIF. There are several tools for creating a GIF from a screen capture. I use [`byzanz`](https://www.maketecheasier.com/record-screen-as-animated-gif-ubuntu/).

Some big projects heavily rely on nice screenshots and GIFs. For example, [Superset](https://github.com/apache/incubator-superset) includes a ton of screenshots to make you want to try it out, and add a link to the [extensive documentation](https://superset.incubator.apache.org/) for installation and configuration.

I don't think that a list of user testimonials is that important, but you should definitely include a list of features to give other developers a clear picture of what your project does.

#### Can I use this code?

You should include a section for the installation/configuration of your project and a section for some common usage. Be clear about your project requirements and dependencies. Does your project work only on Ubuntu? Have you tried on Windows or on a Mac?

You should write which license your project is using. You can also omit this information in the README and include a LICENSE file instead, but adding the license type (not the entire text!) to the README doesn't hurt. If you have a non-permissive license, stick it at the very top.

#### Can I trust this code?

The first thing I look when I find a new project is the date of the last commit. This gives me an idea whether the project is still maintained or not.

Build badges and Continuous Integration can help you if you want to gain more trust from other developers. If your project becomes popular, you can also add a badge that shows the number of downloads per month. This could give you some social validation and persuade other developers to adopt your project. Badges look cool and you might overdo here. For each badge, consider: "what real value is this badge providing to the typical viewer of this README?"

A developer might have additional questions about your project. Don't forget to include some contact details (email, Twitter).

#### Additional sections

If you are aware of similar projects you can list them and maybe add a brief comparison with your project. For example, have a look at [Cookiecutter](https://github.com/audreyr/cookiecutter). I don't think it makes sense to add a very detailed comparison with other projects. Maybe you can write an article on your blog and link it in the README.

If your project grows, you could add a FAQ section and a How to Contribute section.

What about the changelog? I think that the information in the changelog is too detailed and not of much use for someone who sees your project for the first time. If we accept a README as an abstraction, it doesn't really make sense to include a changelog in it. I think it's better to have the changelog in a different file. Also, keep in mind that if your project grows the changelog will take too much space in the README.

## Project starter or project clone

The README for a project starter is very similar to the one of a library.

When I find a project starter I look for these things:

* Screenshots / GIF / Live demo: I want to see the project in action. Don't underestimate even a simple screenshot! It's a great driver for motivation. I know that if I take the time to install this project I will get a fully functional project.
* Installation / Quickstart: the documentation here must be concise. I don't like to spend hours just to decide if I want to try it out or not.
* Features: does it have everything I want? Is there anything else that I can replace or remove? How can I do it?
* References: I want to know why the project starter is structured this way. It would probably be too long to write that in the README, but you can add a list of articles that I can read (e.g. maybe you decided to follow [the twelve factors](https://12factor.net/)).
* FAQs: if the project is big enough, I think it makes sense to add a section for the most common questions a developer might have about the project.

A good example of a project starter is [Cookiecutter Django](https://github.com/pydanny/cookiecutter-django), even if it lacks a screenshot of the web app. I also like [Cookiecutter Flask](https://github.com/sloria/cookiecutter-flask), which is a lot less verbose and shows a nice screenshot of the project.

In a project clone, a screenshot / GIF is even more important. Have a look at a Hacker News clone website built with Vue.js. See the difference between the [boring, older version](https://github.com/vuejs/vue-hackernews), and the [shiny, more recent version](https://github.com/vuejs/vue-hackernews-2.0). The older version has a brief set of instructions how to install it, run it, and includes a link to the Live demo. The newer version adds a nice screenshot, a list of features and an architecture overview.

## Cookbook repository

With "Cookbook repository" I mean a repository where you have a set of small, standalone modules. You can call them recipes. Each recipe is independent of the other ones and performs a specific task, solves a particular problem or shows how to use a particular library across different scenarios.

A good example of cookbook repository is [Search-Script-Scrape: 101 webscraping and research tasks for the data journalist](https://github.com/stanfordjournalism/search-script-scrape). Each script focuses on a single task and can be used independently: you run it and it prints the answer you are looking for.

Another good example is [Machine Learning From Scratch](https://github.com/eriklindernoren/ML-From-Scratch), which contains bare bones Python implementations of some of the fundamental Machine Learning models and algorithms.

The most important things in a cookbook repository are:

* Table of Contents: if the list of recipes is rather long and can be subdivided into smaller topics, create sections (e.g. Supervised Learning, Unsupervised Learning).
* Reproducibility: I should be able to run the scripts without any issue. The dependencies are clearly stated and there is a section to explain how to run them. If a script relies on external data, there is a link to the original dataset.
* Recipes are task-specific.
* Recipes are not too big.
* References: there are links to articles/resources to delve deeper into a specific topic (e.g. a script about how to use [lxml](https://lxml.de/) to perform web scraping on a particular website could have a short README with a list of articles about lxml and a screenshot of the target website).

Keep in mind that on GitHub you can define a README in each directory, so you can include the necessary information where it is more relevant.

```shell
├── README.md
├── sectionA
│   ├── README.md
│   ├── recipeA1.py
│   ├── recipeA2.py
│   └── recipeA3.py
├── sectionB
│   ├── README.md
│   ├── recipeB1.py
│   └── recipeB2.py
└── requirements.txt
```

## List of articles or resources on a topic

Sometimes a repository is just a curated list of resources: a list of links and short descriptions, and basically no code. With this category, I'm referring to all the repositories created with [Awesome](https://github.com/sindresorhus/awesome). Using a repository for a curated list of resources is a great idea, because this way if you care about a topic, you can easily share your knowledge with other developers. Everyone can contribute by adding links to the articles that he finds interesting.

In this kind of repository, the README _is_ the repository, and most of what is valid for the other types of repositories is just not applicable. However, here is what I would like to find:

* Table of Content: especially if a topic is broad enough, there should be several well-defined sections. This is a must for this kind of project. Don't write a single, unordered list of hundreds of articles. Use sections.
* How to contribute: if you want to gather all the good resources about a subject, make it easy for people interested in the subject to add the links to the articles that they found interesting.
* A basic code of conduct: if the project is very popular, probably it's a good idea to have one.

A great example of a curated list of resources is [Awesome Node.js](https://github.com/sindresorhus/awesome-nodejs).
Other examples are [awesome-journalism](https://github.com/eyeseast/awesome-journalism), [awesome-python](https://github.com/vinta/awesome-python), [HowToBeAProgrammer](https://github.com/braydie/HowToBeAProgrammer), [project-guidelines](https://github.com/wearehive/project-guidelines), and of course [Awesome README](https://github.com/matiassingers/awesome-readme).

## Resources

I wrote this article after reading several articles on how to write a great README. Here are the ones that you _have to_ read:

* [The Art of README](https://github.com/noffle/art-of-readme)
* [README driven development](https://tom.preston-werner.com/2010/08/23/readme-driven-development.html)
* [How to write a README that rocks](https://m.dotdev.co/how-to-write-a-readme-that-rocks-bc29f279611a)
* [How To Get Thousands of Stars on Your Github Project](https://blog.cwrichardkim.com/how-to-get-hundreds-of-stars-on-your-github-project-345b065e20a2)
* [Top ten reasons why I won't use your open source project](https://changelog.com/posts/top-ten-reasons-why-i-wont-use-your-open-source-project)
