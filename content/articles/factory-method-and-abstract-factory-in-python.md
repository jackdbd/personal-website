---
date: "2017-03-13"
tags:
  - design patterns
  - Python
title: Factory Method and Abstract Factory in Python
---

Factory Method and Abstract Factory are **creational** design patterns and allow you to create objects without manually invoking a constructor. These patterns are closely related and share many similarities, that's why I had a hard time in understanding the difference between the two.

A [concise answer on Stack Overflow](https://stackoverflow.com/questions/4209791/design-patterns-abstract-factory-vs-factory-method/4210168) pointed me in the right direction, suggesting me to focus on the intent of these patterns. So, let's see what problem Factory Method and Abstract Factory try to solve.

## Factory Method

In Factory Method the client knows what she wants, but for some reason she can't create the object directly. The reasons vary case-by-case: maybe she wants to use a common interface instead of manually instantiating the class she requires, or maybe she would need to pass a huge set of parameters to the constructor. Most of the time the client wants a single object, and this pattern relieves her of the responsibility of creating this object directly.

Let's see a very simple example:

```python
class _Car(object):
    pass


class _Bike(object):
    pass


def factory_method(product_type):
    if product_type == 'car':
        return _Car()
    elif product_type == 'bike':
        return _Bike()
    else:
        raise ValueError('Cannot make: {}'.format(product_type))


def main():
    for product_type in ('car', 'bike'):
        product = factory_method(product_type)
        print(str(product))

if __name__ == '__main__':
    main()
```

Here the client knows that in the end she wants a bike or a car, but since these two classes are private she should not use them directly. Instead she will call `factory_method`, that will instantiate such classes for her. Here factory_method is just a function, and acts as a "virtual" constructor of either `_Car` or `_Bike`.

## Abstract Factory

In Abstract Factory the client might not known what she wants, and how many objects she wants. This pattern provides an interface for creating families of related objects without the client having to specify the classes of the objects being created. In fact, the emphasys on families of related objects is the hallmark of the abstract factory pattern.

Let's start from the client code, namely the main function.

```python
import random
import inspect
from abc import ABC, abstractmethod

def main():
    triangles = give_me_some_polygons(TriangleFactory)
    print('{} triangles'.format(len(triangles)))
    for triangle in triangles:
        print_polygon(triangle)

if __name__ == '__main__':
    main()
```

The function `give_me_some_polygons` is the **interface** between the client and the factory (in this example I wanted to be flexible and pass multiple abstract factories to this function, but this is just a detail). `give_me_some_polygons` calls the factory's `make_polygon` method a random number of times, and returns a list of products to the client.

```python
def give_me_some_polygons(factories, color=None):
    """Interface between the client and a Factory class.
    Parameters
    ----------
    factories : list, or abc.ABCMeta
        list of factory classes, or a factory class
    color : str
        color to pass to the manufacturing method of the factory class.
    Returns
    -------
    products : list
        a list of objects manufactured by the Factory classes specified
    """
    if not hasattr(factories, '__len__'):
        factories = [factories]

    products = list()
    for factory in factories:
        num = random.randint(5, 10)
        for i in range(num):
            product = factory.make_polygon(color)
            products.append(product)

    return products
```

Let's jump to `PolygonFactory`, the abstract factory at the top of the class hierarchy of factories. I decided to use the module `abc` and make `PolygonFactory` inherit from `ABC` so it's clear that it's an abstract class and cannot be instantiated. Since it's a factory, it will manufacture some products. The list of products available for this class is a characteristic of the class itself, that's why I used the `@classmethod` decorator.

```python
class PolygonFactory(ABC):
    """Basic abstract Factory class for making polygons (products).
    This class has to be sublassed by a factory class that MUST implement
    the "products" method.
    A factory class can create many different polygon objects (products) without
    exposing the instantiation logic to the client. Infact, since all methods of
    this class are abstract, this class can't be instantiated at all! Also, each
    subclass of PolygonFactory should implement the "products" method and keep
    it abstract, so even that subclass can't be instatiated.
    """
    @classmethod
    @abstractmethod
    def products(cls):
        """Products that the factory can manufacture. Implement in subclass."""
        pass

    @classmethod
    @abstractmethod
    def make_polygon(cls, color=None):
        """Instantiate a random polygon from all the ones that are available.
        This method creates an instance of a product randomly chosen from all
        products that the factory class can manufacture. The 'color' property of
        the manufactured object is reassigned here. Then the object is returned.
        Parameters
        ----------
        color : str
            color to assign to the manufactured object. It replaces the color
            assigned by the factory class.
        Returns
        -------
        polygon : an instance of a class in cls.products()
            polygon is the product manufactured by the factory class. It's one
            of the products that the factory class can make.
        """
        product_name = random.choice(cls.products())
        this_module = __import__(__name__)
        polygon_class = getattr(this_module, product_name)
        polygon = polygon_class(factory_name=cls.__name__)
        if color is not None:
            polygon.color = color
        return polygon

    @classmethod
    @abstractmethod
    def color(cls):
        return 'black'
```

```python
class TriangleFactory(PolygonFactory):
    """Abstract Factory class for making triangles."""
    @classmethod
    @abstractmethod
    def products(cls):
        return tuple(
            ['_TriangleEquilateral', '_TriangleIsosceles', '_TriangleScalene'])
```

```python
class QuadrilateralFactory(PolygonFactory):
    """Abstract Factory class for making quadrilaterals."""
    @classmethod
    @abstractmethod
    def products(cls):
        return tuple(['_Square', '_Rectangle', '_ConvexQuadrilateral'])
```

The only thing that a subclass of `PolygonFactory` has to do is to override the `products` method.
It's very easy to extend the suite of products a factory can manufacture. For example, `TriangleFactory` contains a list of triangles that it can create. If you want to create a new type of triangle, you just have to create a new triangle class (e.g. `_TriangleRectangle`) and add it to the list of triangles in the products method.
Also, this design makes exchanging product families easy, because the specific class of the factory object appears only once in the application. The client is loosely coupled with the products, and if she needs a different family of products (e.g. quadrilaterals instead of triangles) she just needs to pass a different abstract factory to the `give_me_some_polygons` interface.

```python
quadrilaterals = give_me_some_polygons(QuadrilateralFactory, color='blue')
print('{} quadrilaterals'.format(len(quadrilaterals)))
for quadrilateral in quadrilaterals:
    print_polygon(quadrilateral)
```

The only portion of the code that knows what class to instantiate is the `make_polygon` method. It creates an instance of a product (e.g. `_Square`), randomly chosen from all the products that the factory class can manufacture, and returns it to the caller, which is the `give_me_some_polygons` function.

There are only a couple of things still missing for the code to run: a function to print the polygons, and, obviously, all the product classes.

```python
def print_polygon(polygon, show_repr=False, show_hierarchy=False):
    print(str(polygon))
    if show_repr:
        print(repr(polygon))
    if show_hierarchy:
        print(inspect.getmro(polygon.__class__))
        print('\n')
```

```python
class _Polygon(ABC):
    """Basic abstract class for polygons.

    This class is private because the client should not try to instantiate it.
    The instantiation process should be carried out by a Factory class.
    A _Polygon subclass MUST override ALL _Polygon's abstract methods, otherwise
    a TypeError will be raised as soon as we try to instantiate that subclass.
    """
    def __init__(self, factory_name=None):
        self._color = 'black'
        self._manufactured = factory_name

    def __str__(self):
        return '{} {} manufactured by {} (perimeter: {}; area: {})'\
            .format(self.color, self.__class__.__name__, self.manufactured,
                    self.perimeter, self.area)

    @property
    @abstractmethod
    def family(self):
        pass

    @property
    @abstractmethod
    def perimeter(self):
        pass

    @property
    @abstractmethod
    def area(self):
        pass

    @property
    def color(self):
        return self._color

    @color.setter
    def color(self, new_color):
        self._color = new_color

    @property
    def manufactured(self):
        return self._manufactured

    @manufactured.setter
    def manufactured(self, factory_name):
        self._manufactured = factory_name


class _Triangle(_Polygon):
    """Basic concrete class for triangles."""

    @property
    def family(self):
        return 'Triangles'

    @property
    def perimeter(self):
        return 'a+b+c'

    @property
    def area(self):
        return 'base*height/2'


class _TriangleEquilateral(_Triangle):

    @property
    def perimeter(self):
        return '3a'


class _TriangleIsosceles(_Triangle):

    @property
    def perimeter(self):
        return '2a+b'


class _TriangleScalene(_Triangle):
    pass


class _Quadrilateral(_Polygon):
    """Basic concrete class for quadrilaterals."""

    @property
    def family(self):
        return 'Quadrilaterals'

    @property
    def perimeter(self):
        return 'a+b+c+d'

    @property
    def area(self):
        return 'Bretschneider\'s formula'


class _Square(_Quadrilateral):

    @property
    def perimeter(self):
        return '4a'

    @property
    def area(self):
        return 'a*a'


class _Rectangle(_Quadrilateral):

    @property
    def perimeter(self):
        return '2a+2b'

    @property
    def area(self):
        return 'base*height'


class _ConvexQuadrilateral(_Quadrilateral):
    pass
```

You need the code? Grab it [here](https://github.com/jackdbd/design-patterns)!
