---
date: "2017-01-27"
tags:
  - design patterns
  - inversion of control
  - Python
title: Template Method pattern in Python
---

Behavioral design patterns are a family of patterns which focus on algorithms and the assignments of responsibilities between objects. They help in changing the behavior of the objects and reduce the coupling between them. In this article we will see a Python implementation of the _Template Method_ pattern. Next time we will see the [_Strategy_ pattern](https://www.giacomodebidda.com/posts/strategy-pattern-in-python/).

Template Method defines an algorithm's skeleton in a base class, and lets subclasses redefine certain steps of the algorithm. The skeleton stays the same for all subclasses, and it defines which methods to call and when to call them. Some methods in the base class are just _placeholders_ (or _hooks_), and they have to be overridden in each subclass.

A typical implementation of this pattern consists in an abstract class for the base class, and one or more concrete subclasses. The abstract class has the following methods:

1.  one _template method_ that calls one or more methods. Subclasses should not override this particular method, which defines the skeleton of the algorithm. This method gives the name to this pattern, so in this Python implementation I called it `template_method`.
2.  one or more abstract methods, which represent the customizable part of the algorithm. The abstract base class defines these methods, but they are just placeholders and have to be overridden by each subclass. Sometimes they are named "primitive operations", "hooks" or "placeholders". I called these methods `do_step_1` and `do_step_2`.
3.  zero or more methods which are common in each subclass. These methods are implemented in the base class and should not be overridden in any subclass. In Java we could make these methods `final`. In Python we can place two underscore before the method name and "protect" them from being overridden by using [private name mangling](https://docs.python.org/2/reference/expressions.html#atom-identifiers). The method can still be overridden by a subclass, but with no effect, because the name mangling replaces the original method name with the class name where the method is originally defined, plus the original method name itself. In the code below, `__do_absolutely_this` is one of such methods.
4.  one or more methods that have a default implementation in the base class, but that can be overridden by some subclasses. Here is the `do_something` method.

Private name mangling for the `__do_absolutely_this` method. The original class name is prepended to the method name. That's why we see `Algorithm__do_absolutely_this` even when we look at the list of attributes of class `AlgorithmA`.

https://res.cloudinary.com/jackdbd/image/upload/v1599303221/private_name_mangling_nmkcrn.png

## The Skeleton

Here is the abstract base class which defines the `template_method`.

```python
import sys
from abc import ABC, abstractmethod


class Algorithm(ABC):

    def template_method(self):
        """Skeleton of operations to perform. DON'T override me.

        The Template Method defines a skeleton of an algorithm in an operation,
        and defers some steps to subclasses.
        """
        self.__do_absolutely_this()
        self.do_step_1()
        self.do_step_2()
        self.do_something()

    def __do_absolutely_this(self):
        """Protected operation. DON'T override me."""
        this_method_name = sys._getframe().f_code.co_name
        print('{}.{}'.format(self.__class__.__name__, this_method_name))

    @abstractmethod
    def do_step_1(self):
        """Primitive operation. You HAVE TO override me, I'm a placeholder."""
        pass

    @abstractmethod
    def do_step_2(self):
        """Primitive operation. You HAVE TO override me, I'm a placeholder."""
        pass

    def do_something(self):
        """Hook. You CAN override me, I'm NOT a placeholder."""
        print('do something')
```

## A quick note about the `ABC` module.

Sometimes in Python you create "abstract" methods this way:

```python
def some_method_in_base_class(self):
    raise NotImplementedError('Implement me in subclass')
```

However, you can still create instances of a subclass if you don't override such method. You will simply get a `NotImplementedError` exception when you try to call that method on an instance of the subclass.

I like to use `ABC` because **you cannot even instantiate** a subclass of `Algorithm` if you don't override all abstract methods.

## The Customizable Parts

Each concrete subclass **have to** override `do_step_1` and `do_step_2`, because they are decorated with the `@abstractmethod` decorator from the `ABC` module. Each sublclass **can** override `do_something`, or it will use the default implementation provided by the base class.

```python
class AlgorithmA(Algorithm):

    def do_step_1(self):
        print('do step 1 for Algorithm A')

    def do_step_2(self):
        print('do step 2 for Algorithm A')


class AlgorithmB(Algorithm):

    def do_step_1(self):
        print('do step 1 for Algorithm B')

    def do_step_2(self):
        print('do step 2 for Algorithm B')

    def do_something(self):
        print('do something else')
```

## The Hollywood Principle

Here comes the interesting part...

Most of the time a subclass calls the methods of its parent, so the flow of control goes from the subclass to its parent. However, in `template_method` the flow goes from the base class to a subclass, a principle called _Inversion of Control (IoC)_.

IoC, also called Hollywood Principle - _Don't call us, we'll call you_ - decouples the execution of a task from its implementation. The client code doesn't call directly the methods responsible for the implementation (`do_step_1` and `do_step_2`), but calls a method provided by the base class (`template_method`), which calls the implementation methods itself.

> Capture the abstraction in an interface, and bury the implementation details in its subclasses.

This situation is quite common in frameworks. Each framework designs a common interface that implements the invariant pieces of a system's architecture, and defines placeholders for all customizable parts. Most of the time it's the framework itself that calls the methods supplied by the user.

## The client code

Finally, here is the client code...

```python
def main():
    print('Algorithm A')
    a = AlgorithmA()
    a.template_method()

    print('\nAlgorithm B')
    b = AlgorithmB()
    b.template_method()

if __name__ == '__main__':
    main()
```

and the output:

```python
>>> Algorithm A
>>> AlgorithmA.__do_absolutely_this
>>> do step 1 for Algorithm A
>>> do step 2 for Algorithm A
>>> do something

>>> Algorithm B
>>> AlgorithmB.__do_absolutely_this
>>> do step 1 for Algorithm B
>>> step 2 for Algorithm B
>>> something else
```

You need the code? Grab it [here](https://github.com/jackdbd/design-patterns)!

## References

Here are some additional resources you might find useful:

* [Template Method on Sourcemaking.com](https://sourcemaking.com/design_patterns/template_method)
* [Martin Fowler's article on Inversion of Control](https://martinfowler.com/bliki/InversionOfControl.html)
