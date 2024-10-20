---
date: "2017-10-14T08:30:03.284Z"
tags:
  - Python
  - tests
title: A 5 minute Intro to Hypothesis
---

Let's say you have a Python module called `example.py` where you have a function called `add_numbers` that you want to test.

```python
# example.py
def add_numbers(a, b):
    return a + b
```

This function adds two numbers, so among other things you might want to check that the commutative property holds for all the inputs that the function receives. You create a file called `test_example.py` and start writing a simple unit test to prove it.

## A simple unit test

```python
# test_example.py
import unittest
from your_python_module.example import add_numbers


class TestAddNumbers(unittest.TestCase):

    def test_add_numers_is_commutative(self):
        self.assertEqual(add_numbers(1.23, 4.56), add_numbers(4.56, 1.23))


if __name__ == '__main__':
    unittest.main()
```

That's cool, but you actually didn't prove that the commutative property holds in general. You have just proved that _for this specific case_ such property holds.

You realize that the combination of `1.23` and `4.56` is a very tiny subset of the entire input space of numbers that your function can receive, so you write more tests.

## A common solution: write more test cases

```python
# test_example.py

# more tests here...
    def test_add_numers_is_commutative_another_case(self):
        self.assertEqual(add_numbers(0.789, 321), add_numbers(321, 0.789))
# more tests here...
```

Not a huge gain. You have just proved that _for these other specific cases_ that you wrote the commutative property holds. And obviously you don't want to write a million test cases by hand.

Maybe you have heard about [fuzzing](https://en.wikipedia.org/wiki/Fuzzing), and you want to use it to create random test cases every time you run the test.

## A better solution: fuzzing and ddt

You can create a pair of random floats, so every time you run the test you have a new test case. That's a bit dangerous though, because if you have a failure you cannot reproduce it easily.

```python
# test_example.py
import random
import unittest


class TestAddNumbers(unittest.TestCase):

    def test_add_numers_is_commutative(self):
        a = random.random() * 10.0
        b = random.random() * 10.0
        self.assertEqual(add_numbers(a, b), add_numbers(b, a))


if __name__ == '__main__':
    unittest.main()
```

You can also use a library called [ddt](https://www.giacomodebidda.com/posts/multiply-your-python-unit-test-cases-with-ddt/) to generate many random test cases.

```python
# test_example.py
import random
import unittest
from ddt import ddt, idata, unpack


def float_pairs_generator():
    num_test_cases = 100
    for i in range(num_test_cases):
        a = random.random() * 10.0
        b = random.random() * 10.0
        yield (a, b)


@ddt
class TestAddNumbers(unittest.TestCase):

    @idata(float_pairs_generator())
    @unpack
    def test_add_floats_ddt(self, a, b):
        self.assertEqual(add_numbers(a, b), add_numbers(b, a))


if __name__ == '__main__':
    unittest.main()
```

Here the `float_pairs_generator` generator function creates 100 random pairs of floats. With this trick you can multiply the number of test cases while keeping your tests easy to maintain.

That's definitely a step in the right direction, but if you think about it we are still testing some random combinations of numbers between 0.0 and 10.0 here. Not a very extensive portion of the input domain of the function `add_numbers`.

You have two options:

1.  find a way to generate _domain objects_ that your function can accept. In this case the domain objects are the floats that `add_numbers` can receive.
2.  use hypothesis

I don't know about you, but I'm going for the second one.

## The best solution: Hypothesis

Here is how you write a test that checks that the commutative property holds for a pair of floats.

```python
# test_example.py
from hypothesis import given
from hypothesis.strategies import floats
from your_python_module.example import add_numbers


@given(a=floats(), b=floats())
def test_add_numbers(a, b):
    assert add_numbers(a, b) == add_numbers(b, a)


if __name__ == '__main__':
    test_add_numbers()
```

When I ran this test I was shocked. It failed!

WTF! How it that possible that this test fails, after I have tried 100 test cases with ddt?

Luckily with hypothesis you can increase the verbosity level of your test by using the `@settings` decorator.

Let's say you also want to test a specific test case: `a == 1.23` and `b == 4.56`. For this you can use the `@example` decorator. This is nice because now your test provides some _documentation_ to anyone who wants to use the `add_numbers` function, and at the same time you are testing a specific case that you know about or that might be particularly hard to hit.

```python
# test_example.py
from hypothesis import given, example, settings, Verbosity
from hypothesis.strategies import floats
from your_python_module.example import add_numbers


@settings(verbosity=Verbosity.verbose)
@example(a=1.23, b=4.56)
@given(a=floats(), b=floats())
def test_add_numbers(a, b):
    assert add_numbers(a, b) == add_numbers(b, a)


if __name__ == '__main__':
    test_add_numbers()
```

Obviously the test fails again, but this time you get more insights about it.

```shell
Trying example: test_add_numbers(a=1.23, b=4.56)
Trying example: test_add_numbers(a=0.0, b=nan)
Traceback (most recent call last):
  # Traceback here...
AssertionError
Trying example: test_add_numbers(a=0.0, b=nan)
Traceback (most recent call last):
  # Traceback here...
AssertionError
Trying example: test_add_numbers(a=0.0, b=1.0)
Trying example: test_add_numbers(a=0.0, b=4293918720.0)
Trying example: test_add_numbers(a=0.0, b=281406257233920.0)
Trying example: test_add_numbers(a=0.0, b=7.204000185188352e+16)
Trying example: test_add_numbers(a=0.0, b=inf)
# more test cases...
You can add @seed(247616548810050264291730850370106354271) to this test to reproduce this failure.
```

That's really helpful. You can see all the test case that were successful and the ones that caused a failure. You get also a `seed` that you can use to reproduce this very specific failure at a later time or on a different computer. This is so awesome.

Anyway, why does this test fail? It fails because in Python `nan` and `inf` are valid floats, so the function `floats()` might create some test cases that have `a == nan` and/or `b == inf`.

Are `nan` and `inf` valid inputs for your application? Maybe. It depends on your application.

If you are absolutely sure that `add_numbers` will never receive a `nan` or a `inf` as inputs, you can write a test that never generates either `nan` or `inf`. You just have to set `allow_nan` and `allow_infinity` to `False` in the `@given` decorator. Easy peasy.

```python
# test_example.py
from hypothesis import given, example, settings, Verbosity
from hypothesis.strategies import floats
from your_python_module.example import add_numbers


@given(
  a=floats(allow_nan=False, allow_infinity=False),
  b=floats(allow_nan=False, allow_infinity=False))
def test_add_numbers(a, b):
    assert add_numbers(a, b) == add_numbers(b, a)


if __name__ == '__main__':
    test_add_numbers()
```

But what if `add_numbers` could in fact receive `nan` or `inf` as inputs (a much more realistic assumption). In this case the test should be able to generate `nan` or `inf`, your function should raise specific exceptions that you will have to handle somewhere else in your application, and the test should not consider _such specific exceptions_ as failures.

Here is how `example.py` might look:

```python
# example.py
import math

class NaNIsNotAllowed(ValueError):
    pass

class InfIsNotAllowed(ValueError):
    pass

def add_numbers(a, b):
    if math.isnan(a) or math.isnan(b):
        raise NaNIsNotAllowed('nan is not a valid input')
    elif math.isinf(a) or math.isinf(b):
        raise InfIsNotAllowed('inf is not a valid input')
    return a + b
```

And here is how you write the test with hypothesis:

```python
# test_example.py
from hypothesis import given
from hypothesis.strategies import floats
from your_python_module.example import add_numbers, NaNIsNotAllowed, InfIsNotAllowed


@given(a=floats(), b=floats())
def test_add_numbers(a, b):
    try:
        assert add_numbers(a, b) == add_numbers(b, a)
    except (NaNIsNotAllowed, InfIsNotAllowed):
        reject()


if __name__ == '__main__':
    test_add_numbers()
```

This test will generate some `nan` and `inf` inputs, `add_numbers` will raise either `NaNIsNotAllowed` or `InfIsNotAllowed` and the test will catch these exceptions and reject them as test failures (i.e. the test case will be considered a success when either `NaNIsNotAllowed` or `InfIsNotAllowed` occurs).

Can you really afford to reject `nan` as an input value for `add_numbers`? Maybe not. Let's say your code needs to sum two samples in a time series, and one sample of the time series is missing: `nan` would be a perfectly valid input for `add_numbers` in such case.

## References

* [What is Property Based Testing?](https://hypothesis.works/articles/what-is-property-based-testing/)
* [Getting started with Hypothesis](https://hypothesis.works/articles/getting-started-with-hypothesis/)
* [Anatomy of a Hypothesis Based Test](https://hypothesis.works/articles/anatomy-of-a-test/)
* [Evolving toward property-based testing with Hypothesis](https://hypothesis.works/articles/incremental-property-based-testing/)
