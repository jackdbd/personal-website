---
date: "2017-01-28"
tags:
  - design patterns
  - inversion of control
  - Python
title: Strategy pattern in Python
---

_Strategy_ (also known as _Policy_) is a behavioral design pattern that enables an algorithm's behavior to be selected at runtime.

All implemented behaviors are either classes, methods, or functions, and they are usually called _strategies_. The portion of code that decides which strategy to adopt is called _context_.

Strategy follows two important principles:

* Open/closed principle: software entities (classes, modules, functions, etc.) should be open for extension, but closed for modification.
* Inversion of Control principle: custom-written portions of a program (e.g. a method in a subclass) receive the flow of control from a generic framework (e.g. a base class).

Following these two principles is extremely useful when you want to design a common interface (the _Closed_ part of the Open/Closed principle), but allow for changes in the implementation details (the _Open_ part of the Open/Closed principle). Every time you want to program a new implementation, you pass it to the common interface without altering anything in the interface code, and you plug the client code to the interface. This way the client code is _loosely coupled_, namely it is coupled only with an abstraction (i.e. the common interface), not with the concrete implementations (i.e. the various strategies).

## How to implement a Strategy pattern in Python?

In programming languages like Java you can implement the Strategy pattern by creating a common (abstract) interface and subclassing it with a new class for each strategy. You can do the same in Python, like it's done [here](https://python-3-patterns-idioms-test.readthedocs.io/en/latest/FunctionObjects.html#strategy-choosing-the-algorithm-at-runtime). However, you can also use a leaner approach: create a single `Strategy` class and replace a method of that class, at runtime, with a different function based on a given context.

Enough talking, let's see some code!

## The `Strategy` class

This class is the interface that the client code will use. It represents the _Closed_ part of the Open/Closed principle, so it should not be modified.

If the client code does not provide a function `func`, `Strategy` will use the default algorithm, namely `execute` in this example.

In the `__init__` method we are taking advantage of the fact that Python supports **higher order functions**, namely we can pass a function as an argument to another function, and that Python functions are **first class objects**, so they can be assigned to variables, or stored in data structures (e.g. a dict).

If the client provides a function `func`, this will be passed to the `__init__` method and assigned to the `execute` method. This means that the `execute` method will be redefined when the `Strategy` class is _instantiated_.

```python
class Strategy(object):

    def __init__(self, func=None):
        if func is not None:
            self.execute = func
            self.name = '{}_{}'.format(self.__class__.__name__, func.__name__)
        else:
            self.name = '{}_default'.format(self.__class__.__name__)

    def execute(self):
        print('Default method')
        print('{}\n'.format(self.name))
```

That's cool, but there is a problem: `func` is **just a function**, it contains no reference to the instance it is bound to (like a Python method defined by using the `@staticmethod` decorator). Within the redefined `execute` you cannot access other methods or attributes of the instance.

However with some Python magic and the help of the `types` module you can convert a normal function into a bound method, namely a function that contains a reference to the instance it is bound to.

```python
import types


class Strategy(object):

    def __init__(self, func=None):
        if func is not None:
            # take a function, bind it to this instance, and replace the default bound method 'execute' with this new bound method.
            self.execute = types.MethodType(func, self)
            self.name = '{}_{}'.format(self.__class__.__name__, func.__name__)
        else:
            self.name = '{}_default'.format(self.__class__.__name__)

    def execute(self):
        print('Default method')
        print('{}\n'.format(self.name))
```

Now it's time to implement some _strategies_.

## Implement the _strategies_

Let's define a couple of _replacement strategies_ for the default method `execute`. Don't mind the `self` parameter, for now these ones are just regular functions. I decided to use `self` because I know that these functions, passed to the `Strategy`'s `__init__` method, will be bound to an instance of `Strategy` (this is done when the line `types.MethodType(func, self)` is executed).

```python
def execute_replacement1(self):
    print('Replacement1 method')
    print('{}\n'.format(self.name))


def execute_replacement2(self):
    print('Replacement2 method')
    print('{}\n'.format(self.name))
```

## Select a strategy at runtime

In this simple example the part of the program which decides which strategy to use, namely the _context_, is the `main` function. As you can see, the three instances of `Strategy` are calling the same method.

```python
def main():

    s0 = Strategy()
    s0.execute()

    s1 = Strategy(execute_replacement1)
    s1.execute()

    s2 = Strategy(execute_replacement2)
    s2.execute()

if __name__ == '__main__':
    main()
```

This is the output:

```python
>>> Default method
>>> Strategy_default

>>> Replacement1 method
>>> Strategy_execute_replacement1

>>> Replacement2 method
>>> Strategy_execute_replacement2
```

## An even simpler Strategy

Sometimes you don't even have to create a class, and you can achieve a similar result by assigning a function to an object, and then later calling that object. For example, this is also a Strategy:

```python
def add(a, b):
    return a + b

def subtract(a, b):
    return a - b

solve = add
solve(a, b)

solve = subtract
solve(a, b)
```

## Strategy VS Template Method

Strategy and [Template Method](https://www.giacomodebidda.com/posts/template-method-pattern-in-python/) are very similar and follow the same principles. The main difference is that in Template Method an implementation is chosen at _compile time_ by _inheritance_, while in Strategy is chosen at _runtime_ by _containment_. See also [here](https://stackoverflow.com/a/669366) to understand the difference between these two behavioral design patterns.

You need the code? Grab it [here](https://github.com/jackdbd/design-patterns)!
