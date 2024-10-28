---
date: "2017-03-13"
tags:
  - Python
  - tests
title: Multiply your Python Unit Test Cases with DDT
---

DDT (Data-Driven Tests) is a small python module that allows you to multiply your unit test cases for free.
The idea is pretty simple: you write a single test case and define some data samples, and DDT will generate a test case for each sample you provided.

You might ask: _"Why is that useful?"_

Consider the following example, a simple test case without using DDT.

```python
import unittest


class TestWithoutDDT(unittest.TestCase):

    def test_without_ddt(self):
        for x in [1, -2, 3, 4, -5]:
            self.assertGreater(x, 0)
```

If you run this test you will get the following output:

```python
Failure
Traceback (most recent call last):
  File "/home/jack/Repos/design-patterns/test_ddt.py", line 47, in test_without_ddt
    self.assertGreater(x, 0)
AssertionError: -2 not greater than 0
```

The test failed as soon as it asserted that `-2` is greater than `0` and then stopped. It didn't consider `3`, `4`, or `-5`, so you don't don't whether the test would have passed for those inputs or not.

Now take a look at a very similar test with `DDT`.

```python
import unittest
from ddt import ddt, data, idata, file_data, unpack


@ddt
class TestDDTData(unittest.TestCase):

    @data(1, -2, 3, 4, -5)
    def test_with_ddt_data(self, x):
        self.assertGreater(x, 0)
```

If you run this test you will get two distinct failures, for `-2` and `-5`.

```python
Failure
Traceback (most recent call last):
  File "/home/jack/.virtualenvs/design-patterns/lib/python3.5/site-packages/ddt.py", line 139, in wrapper
    return func(self, *args, **kwargs)
  File "/home/jack/Repos/design-patterns/test_ddt.py", line 15, in test_with_ddt_data
    self.assertGreater(x, 0)
AssertionError: -2 not greater than 0

Failure
Traceback (most recent call last):
  File "/home/jack/.virtualenvs/design-patterns/lib/python3.5/site-packages/ddt.py", line 139, in wrapper
    return func(self, *args, **kwargs)
  File "/home/jack/Repos/design-patterns/test_ddt.py", line 15, in test_with_ddt_data
    self.assertGreater(x, 0)
AssertionError: -5 not greater than 0
```

This means that **all of the inputs were tested**, and two of them failed. Now you know why DDT is so cool!

It takes less than 2 minutes to read the [documentation](https://ddt.readthedocs.io/en/latest/example.html), and the examples are great!

The main reason why I like DDT is that it's very easy to use: just decorate a test class with the `@ddt` decorator, and every test case you want with one of the decorators provided by this module. Here are the decorators available:

* `@data`: contains as many arguments as the values you want to feed to the test. This values can be numbers, strings, tuples, etc. In the case of tuples, a cool feature is that you can `@unpack` them.
* `@file_data`: loads the test data from a JSON or YAML file.
* `@idata`: generates a new data sample from a generator function you defined somewhere in the code. (At this moment this decorator is not mentioned in the documentation).

Here is an example with a generator function and `@idata`:

```python
import unittest
from ddt import ddt, idata


def number_generator():
    for x in [1, -2, 3, 4, -5]:
        yield x


@ddt
class TestDDTGenerator(unittest.TestCase):

    @idata(number_generator())
    def test_with_ddt_idata(self, x):
        self.assertGreater(x, 0)
```

And here an example where the data is stored in an external file (JSON):

_mydatafile.json_

```json
[1, 2, 3, 4, 5]
```

```python
import unittest
from ddt import ddt, file_data


@ddt
class TestDDTDataFile(unittest.TestCase):

    @file_data('mydatafile.json')
    def test_with_ddt_file_data(self, x):
        self.assertGreater(x, 0)
```

Finally, an example where the data in unpacked:

```python
import unittest
from ddt import ddt, data, unpack


@ddt
class TestDDTDataUnpack(unittest.TestCase):

    @data(('hello', 3), ('answer', 42))
    @unpack
    def test_with_ddt_data_unpack(self, some_string, some_integer):
        self.assertIsInstance(some_string, str)
        self.assertIsInstance(some_integer, int)
```

## Alternatives to DDT

The idea of test generators is not new, and there are at least two modules with similar capabilities: [genty](https://github.com/box/genty/blob/master/README.rst) and [data-provider](https://pypi.python.org/pypi/unittest-data-provider/1.0.0). I opted for DDT because it seems better documented and more pythonic, but genty looks pretty good too. In particular, the `@genty_repeat` decorator might be a nice feature that is not available in DDT(even if one could probably obtain the same functionality by using the [retrying](https://pypi.python.org/pypi/retrying) module).
