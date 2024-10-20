---
date: "2017-01-21"
tags:
  - design patterns
  - Python
title: Bridge pattern in Python
---

I struggled quite a bit with the Bridge pattern. The idea itself is rather simple, decouple an interface from its implementation, but I couldn't think about a simple, yet "real life" example of this pattern.

## A Bridge between two class hierarchies

The purpose of the Bridge pattern is to split a concept into two independent class hierarchies. These two class hierarchies are usually called _Interface_ (or _Handle_, or _Abstraction_) and _Implementation_ (or _Body_).

A [classic example](https://en.wikipedia.org/wiki/Bridge_pattern#Java) of Bridge is used in the definition of shapes in an UI environment: one class hierarchy is responsible to define shapes, the other one to draw them on the screen.

Bridge achieves the [separation of concerns](https://en.wikipedia.org/wiki/Separation_of_concerns) between orthogonal class hierarchies via _composition_: the interface object encapsulates an instance of an Implementation class. The Interface class is used directly by the client, but the actual work is done in the Implementation class. The client interacts with the interface object, and doesn't have to deal with the details of the different implementations. It's the interface object that delegates all requests to the implementation object it encapsulates.

> Decouple an abstraction from its implementation so that the two can vary independently.

## A simple, yet real world use-case

As I said at the beginning, it wasn't easy for me to find a simple real-life scenario where I would use this pattern. I didn't want to reuse the shape-draw example, and the first attempts I made where either too trivial or they were missing the point.

Then I though about A/B testing.

Let's say that you want to build a news website and you want to show different content for different users. You want to give paid users full access to articles, without any ads. At the same time, you want to give free users some excerpts from the articles, with some ads on the page. Finally, you want to show a [_call to action_](<https://en.wikipedia.org/wiki/Call_to_action_(marketing)>) to all free users, so you can hopefully convert them to paid users.

You know what to draw in the UI, and where to draw it, but you still can't decide on what to put in the call to action. Here is where A/B testing comes in: you can create two different implementations of the UI components, and by changing only the call to action you can decide which one is more effective.
In a real life scenario the call to action could be a web component of some sort, maybe an element with a slightly different style, color, font size, etc. In this example it's just a different sentence for the two implementations.

It might be useful to summarize what the components in this toy example represent:

{% table %}
Client,Interface,Implementation
the user,the UI of the website,what it's drawn in each UI component
{% endtable %}

The Interface is the UI of website. There are free users and paid users, so there are two interfaces to build: one with ads, excerpts and a call to action (free version) and another one with full articles (paid version).

Ok, let's see some code!

First, let's define an abstract class for the website. This is the _abstraction of the Interface_ (or _abstraction of the Abstraction_).

```python
from abc import ABC, abstractmethod


# Abstract Interface (aka Handle) used by the client
class Website(ABC):

    def __init__(self, implementation):
        # encapsulate an instance of a concrete implementation class
        self._implementation = implementation

    def __str__(self):
        return 'Interface: {}; Implementation: {}'.format(
            self.__class__.__name__, self._implementation.__class__.__name__)

    @abstractmethod
    def show_page(self):
        pass
```

Here is the free version of the website. It's a concrete Interface (or _refined Abstraction_).

```python
# Concrete Interface 1
class FreeWebsite(Website):

    def show_page(self):
        ads = self._implementation.get_ads()
        text = self._implementation.get_excerpt()
        call_to_action = self._implementation.get_call_to_action()
        print(ads)
        print(text)
        print(call_to_action)
        print('')
```

And here is the paid version of the website.

```python
# Concrete Interface 2
class PaidWebsite(Website):

    def show_page(self):
        text = self._implementation.get_article()
        print(text)
        print('')
```

Now it's useful to have a look at the Client code. Each interface object requires an instance of an Implementation class, but apart from that, the client code interacts only with the interface, not with the implementation.

```python
# Client
def main():
    a_free = FreeWebsite(ImplementationA())
    print(a_free)
    a_free.show_page()  # the client interacts only with the interface

    b_free = FreeWebsite(ImplementationB())
    print(b_free)
    b_free.show_page()

    a_paid = PaidWebsite(ImplementationA())
    print(a_paid)
    a_paid.show_page()

    b_paid = PaidWebsite(ImplementationB())
    print(b_paid)
    b_paid.show_page()

if __name__ == '__main__':
    main()
```

Finally, here is the Implementation class hierarchy. First, the abstract class.

```python
# Abstract Implementation (aka Body) decoupled from the client
class Implementation(ABC):

    def get_excerpt(self):
        return 'excerpt from the article'

    def get_article(self):
        return 'full article'

    def get_ads(self):
        return 'some ads'

    @abstractmethod
    def get_call_to_action(self):
        pass
```

Second, the concrete implementations.

```python
# Concrete Implementation 1
class ImplementationA(Implementation):

    def get_call_to_action(self):
        return 'Pay 10 $ a month to remove ads'
```

```python
# Concrete Implementation 2
class ImplementationB(Implementation):

    def get_call_to_action(self):
        return 'Remove ads with just 10 $ a month'
```

Here is the output of the client code (main function) in this example:

```python
>>> Interface: FreeWebsite; Implementation: ImplementationA
>>> some ads
>>> excerpt from the article
>>> Pay 10 $ a month to remove ads  # <-- call to action A
```

```python
>>> Interface: FreeWebsite; Implementation: ImplementationB
>>> some ads
>>> excerpt from the article
>>> Remove ads with just 10 $ a month  # <-- call to action B
```

```python
>>> Interface: PaidWebsite; Implementation: ImplementationA
>>> full article
```

```python
>>> Interface: PaidWebsite; Implementation: ImplementationB
>>> full article
```

There is no call to action in the paid version, so there is no difference between ImplementationA and ImplementationB. This is a toy example after all. In the real world `ImplementationA` could return a random article, while `ImplementationB` could track the user preferences and guess an article he/she might be interested in. Also, in a real world scenario you could perform A/B testing of a website by choosing a random implementation instead of declaring it explicitly. Something along these lines:

```python
import random
random_implementation = random.choice([ImplementationA(), ImplementationB()])
```

## References

These articles really helped me to understand the Bridge pattern:

* [Bridge](https://sourcemaking.com/design_patterns/bridge)
* [Design Patterns Simplified: The Bridge Pattern](https://simpleprogrammer.com/2015/06/08/design-patterns-simplified-the-bridge-pattern/)
