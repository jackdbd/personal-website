---
date: "2017-04-02"
tags:
  - design patterns
  - Python
title: "MVC pattern in Python: Introduction and BasicModel"
---

If you have ever worked with Graphical User Interfaces or web frameworks (e.g. Django), chances are that you heard about the _Model-View-Controller_ pattern.
Since I wanted to understand and implement in Python the most popular patterns, I decided I had to implement a basic MVC from scratch.

This is the **first** article of a series of blog posts related to the MVC pattern. Here are the links to the other articles in the series:

1. [MVC pattern in Python: Introduction and BasicModel](https://www.giacomodebidda.com/posts/mvc-pattern-in-python-introduction-and-basicmodel/)
2. [MVC pattern in Python: SQLite](https://www.giacomodebidda.com/posts/mvc-pattern-in-python-sqlite/)
3. [MVC pattern in Python: Dataset](https://www.giacomodebidda.com/posts/mvc-pattern-in-python-dataset/)

_All code was written in Python 3.5. If you are using Python 2.7 you should be able to run it with a few minor changes._

---

Table of contents

1. <a href="#intro">Introduction</a>
2. <a href="#crud">CRUD</a>
3. <a href="#model">Model</a>
4. <a href="#view">View</a>
5. <a href="#controller">Controller</a>
6. <a href="#test-run">Test Run</a>
7. <a href="#conclusion">Conclusion</a>

<a><h2>Introduction</h2></a>
The three components of the MVC pattern are **decoupled** and they are responsible for different things:

* the **Model** manages the data and defines rules and behaviors. It represents the [business logic](WIKIPEDIA) of the application. The data can be stored in the Model itself or in a database (only the Model has access to the database).
* the **View** presents the data to the user. A View can be any kind of output representation: a HTML page, a chart, a table, or even a simple text output. A View should never call its own methods; only a Controller should do it.
* the **Controller** accepts user's inputs and delegates data representation to a View and data handling to a Model.

Since Model, View and Controller are **decoupled**, each one of the three can be extended, modified and replaced without having to rewrite the other two.

<a><h2>CRUD</h2></a>
In order to understand how the MVC works I decided to implement a simple CRUD (Create, Read, Update, Delete) application.

_A word of caution:_ according to Wikipedia, [create, read, update, and delete](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) are the four basic functions of _persistent storage_. A persistence layer can be implemented with a database table, a XML file, a JSON, or even a CSV. However, in this first post I want to keep things as simple as possible, so I will create a MVC application that doesn't have any persistent storage. You could argue that this is not really a CRUD application, but I hope that you will be satisfied with the next article, where I will implement the persistence layer with a SQLite database.

Let's think about the inventory of a small grocery store. A typical product list would look like this:

{% table %}
Name,Price,Quantity
Bread,0.5,20
Milk,1.0,10
Wine,10.0,5
{% endtable %}

In Python you can think about these items as a list of dictionaries.

```python
my_items = [
    {'name': 'bread', 'price': 0.5, 'quantity': 20},
    {'name': 'milk', 'price': 1.0, 'quantity': 10},
    {'name': 'wine', 'price': 10.0, 'quantity': 5},
]
```

The list of items can be changed any time you perform one of the following operations:

* **create** new items
* **update** existing items
* **delete** existing items

The **read** operation does not modify anything in the list of items.

Instead of jumping straight into creating classes for Model, View and Controller, let's try to implement each CRUD functionality in the simplest way possible. Keep in mind that we have to use a `global` variable to store the list of `items` because its state must be shared across all operations.

Create a python script and call it `basic_backend.py`.

Let's start with the _Create_ functionality.

```python
# basic_backend.py
items = list()  # global variable where we keep the data


def create_items(app_items):
    global items
    items = app_items


def create_item(name, price, quantity):
    global items
    items.append({'name': name, 'price': price, 'quantity': quantity})
```

As you can see, _Create_ operations don't return anything. They just append new data to the global `items` list.

Let's add a _Read_ functionality.

```python
# basic_backend.py
def read_item(name):
    global items
    myitems = list(filter(lambda x: x['name'] == name, items))
    return myitems[0]


def read_items():
    global items
    return [item for item in items]
```

Actually there are already a couple of problems with this implementation:

1. if you create the same element twice, you get a duplicate in the `items` list;
2. if you try to read a non-existing item, you get an `IndexError` exception.

These issues are very easy to fix, but I think it's important to pause for a moment and think about why they are a problem for your application, and how you want to handle these exceptions.

1. _duplicate item_ -> you don't want duplicates in the list of items. As soon as the user tries to append an item that already exists, you want to prevent this operation and return her a message that the item was _already stored_.
2. _non-existing item_ -> obviously you can't read an item which is not currently available, so you want to tell the user that the item is _not stored_.

It's important to think about these issues right now because we want to create specific exceptions for these situations.

In this example `items` is just a list, but if it were a table in a SQLite database, these conditions would trigger different exceptions (e.g. adding a duplicate could raise an `IntegrityError` exception). You want to create exceptions that are at a higher level of abstraction, and implement the exception handling for each persistence layer. If this sounds confusing right now, just bear with me and I hope it will make more sense in the next article.

Let's create these exceptions in a new file and call it `mvc_exceptions.py`.

```python
# mvc_exceptions.py
class ItemAlreadyStored(Exception):
    pass


class ItemNotStored(Exception):
    pass
```

Let's update the code in `basic_backend.py`.

```python
import mvc_exceptions as mvc_exc

items = list()


def create_item(name, price, quantity):
    global items
    results = list(filter(lambda x: x['name'] == name, items))
    if results:
        raise mvc_exc.ItemAlreadyStored('"{}" already stored!'.format(name))
    else:
        items.append({'name': name, 'price': price, 'quantity': quantity})


def create_items(app_items):
    global items
    items = app_items


def read_item(name):
    global items
    myitems = list(filter(lambda x: x['name'] == name, items))
    if myitems:
        return myitems[0]
    else:
        raise mvc_exc.ItemNotStored(
            'Can\'t read "{}" because it\'s not stored'.format(name))


def read_items():
    global items
    return [item for item in items]
```

Now, if you try to create an item that already exists, you get a `ItemAlreadyStored` exception, and if you try to read an item that is not stored, you get a `ItemNotStored` exception.

Let's now add the _Update_ and _Delete_ functionalities.

```python
# basic_backend.py
def update_item(name, price, quantity):
    global items
    # Python 3.x removed tuple parameters unpacking (PEP 3113), so we have to do it manually (i_x is a tuple, idxs_items is a list of tuples)
    idxs_items = list(
        filter(lambda i_x: i_x[1]['name'] == name, enumerate(items)))
    if idxs_items:
        i, item_to_update = idxs_items[0][0], idxs_items[0][1]
        items[i] = {'name': name, 'price': price, 'quantity': quantity}
    else:
        raise mvc_exc.ItemNotStored(
            'Can\'t update "{}" because it\'s not stored'.format(name))


def delete_item(name):
    global items
    # Python 3.x removed tuple parameters unpacking (PEP 3113), so we have to do it manually (i_x is a tuple, idxs_items is a list of tuples)
    idxs_items = list(
        filter(lambda i_x: i_x[1]['name'] == name, enumerate(items)))
    if idxs_items:
        i, item_to_delete = idxs_items[0][0], idxs_items[0][1]
        del items[i]
    else:
        raise mvc_exc.ItemNotStored(
            'Can\'t delete "{}" because it\'s not stored'.format(name))
```

Basically these operations represent the business logic of the application. Let's test them!

```python
# basic_backend.py
def main():

    my_items = [
        {'name': 'bread', 'price': 0.5, 'quantity': 20},
        {'name': 'milk', 'price': 1.0, 'quantity': 10},
        {'name': 'wine', 'price': 10.0, 'quantity': 5},
    ]

    # CREATE
    create_items(my_items)
    create_item('beer', price=3.0, quantity=15)
    # if we try to re-create an object we get an ItemAlreadyStored exception
    # create_item('beer', price=2.0, quantity=10)

    # READ
    print('READ items')
    print(read_items())
    # if we try to read an object not stored we get an ItemNotStored exception
    # print('READ chocolate')
    # print(read_item('chocolate'))
    print('READ bread')
    print(read_item('bread'))

    # UPDATE
    print('UPDATE bread')
    update_item('bread', price=2.0, quantity=30)
    print(read_item('bread'))
    # if we try to update an object not stored we get an ItemNotStored exception
    # print('UPDATE chocolate')
    # update_item('chocolate', price=10.0, quantity=20)

    # DELETE
    print('DELETE beer')
    delete_item('beer')
    # if we try to delete an object not stored we get an ItemNotStored exception
    # print('DELETE chocolate')
    # delete_item('chocolate')

    print('READ items')
    print(read_items())

if __name__ == '__main__':
    main()
```

<a><h2>Model</h2></a>
Now that all CRUD operations are implemented as simple functions, it's very easy to "package" them into a single class. As you can see, there is no mention of `View` or `Controller` in the `ModelBasic` class.

```python
# model_view_controller.py
import basic_backend
import mvc_exceptions as mvc_exc


class ModelBasic(object):

    def __init__(self, application_items):
        self._item_type = 'product'
        self.create_items(application_items)

    @property
    def item_type(self):
        return self._item_type

    @item_type.setter
    def item_type(self, new_item_type):
        self._item_type = new_item_type

    def create_item(self, name, price, quantity):
        basic_backend.create_item(name, price, quantity)

    def create_items(self, items):
        basic_backend.create_items(items)

    def read_item(self, name):
        return basic_backend.read_item(name)

    def read_items(self):
        return basic_backend.read_items()

    def update_item(self, name, price, quantity):
        basic_backend.update_item(name, price, quantity)

    def delete_item(self, name):
        basic_backend.delete_item(name)
```

<a><h2>View</h2></a>
Now that the business logic is ready, let's focus on the presentation layer. In this tutorial the data is presented to the user in a python shell, so this is definitely not something that you would use in a real application. However, the important thing to notice is that there is no logic in the `View` class, and all of its methods are **normal functions** (see the `@staticmethod` decorator). Also, there is no mention of the other two components of the MVC pattern. This means that if you want to design a fancy UI for your application, you just have to replace the `View` class.

```python
# model_view_controller.py
class View(object):

    @staticmethod
    def show_bullet_point_list(item_type, items):
        print('--- {} LIST ---'.format(item_type.upper()))
        for item in items:
            print('* {}'.format(item))

    @staticmethod
    def show_number_point_list(item_type, items):
        print('--- {} LIST ---'.format(item_type.upper()))
        for i, item in enumerate(items):
            print('{}. {}'.format(i+1, item))

    @staticmethod
    def show_item(item_type, item, item_info):
        print('//////////////////////////////////////////////////////////////')
        print('Good news, we have some {}!'.format(item.upper()))
        print('{} INFO: {}'.format(item_type.upper(), item_info))
        print('//////////////////////////////////////////////////////////////')

    @staticmethod
    def display_missing_item_error(item, err):
        print('**************************************************************')
        print('We are sorry, we have no {}!'.format(item.upper()))
        print('{}'.format(err.args[0]))
        print('**************************************************************')

    @staticmethod
    def display_item_already_stored_error(item, item_type, err):
        print('**************************************************************')
        print('Hey! We already have {} in our {} list!'
              .format(item.upper(), item_type))
        print('{}'.format(err.args[0]))
        print('**************************************************************')

    @staticmethod
    def display_item_not_yet_stored_error(item, item_type, err):
        print('**************************************************************')
        print('We don\'t have any {} in our {} list. Please insert it first!'
              .format(item.upper(), item_type))
        print('{}'.format(err.args[0]))
        print('**************************************************************')

    @staticmethod
    def display_item_stored(item, item_type):
        print('++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
        print('Hooray! We have just added some {} to our {} list!'
              .format(item.upper(), item_type))
        print('++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')

    @staticmethod
    def display_change_item_type(older, newer):
        print('---   ---   ---   ---   ---   ---   ---   ---   ---   ---   --')
        print('Change item type from "{}" to "{}"'.format(older, newer))
        print('---   ---   ---   ---   ---   ---   ---   ---   ---   ---   --')

    @staticmethod
    def display_item_updated(item, o_price, o_quantity, n_price, n_quantity):
        print('---   ---   ---   ---   ---   ---   ---   ---   ---   ---   --')
        print('Change {} price: {} --> {}'
              .format(item, o_price, n_price))
        print('Change {} quantity: {} --> {}'
              .format(item, o_quantity, n_quantity))
        print('---   ---   ---   ---   ---   ---   ---   ---   ---   ---   --')

    @staticmethod
    def display_item_deletion(name):
        print('--------------------------------------------------------------')
        print('We have just removed {} from our list'.format(name))
        print('--------------------------------------------------------------')
```

<a><h2>Controller</h2></a>
Finally, now that rules and logic (the Model) and information representation (the View) are done, we can focus on the `Controller`.
As you can see, when you instantiate a `Controller` you have to specify a Model and a View. However, this is just _composition_, so whenever you want to use a different Model, and/or a different View, you just have to plug them in when you instantiate the Controller. The Controller accepts user's inputs and _delegates_ data representation to the View and data handling to the Model.

```python
# model_view_controller.py
class Controller(object):

    def __init__(self, model, view):
        self.model = model
        self.view = view

    def show_items(self, bullet_points=False):
        items = self.model.read_items()
        item_type = self.model.item_type
        if bullet_points:
            self.view.show_bullet_point_list(item_type, items)
        else:
            self.view.show_number_point_list(item_type, items)

    def show_item(self, item_name):
        try:
            item = self.model.read_item(item_name)
            item_type = self.model.item_type
            self.view.show_item(item_type, item_name, item)
        except mvc_exc.ItemNotStored as e:
            self.view.display_missing_item_error(item_name, e)

    def insert_item(self, name, price, quantity):
        assert price > 0, 'price must be greater than 0'
        assert quantity >= 0, 'quantity must be greater than or equal to 0'
        item_type = self.model.item_type
        try:
            self.model.create_item(name, price, quantity)
            self.view.display_item_stored(name, item_type)
        except mvc_exc.ItemAlreadyStored as e:
            self.view.display_item_already_stored_error(name, item_type, e)

    def update_item(self, name, price, quantity):
        assert price > 0, 'price must be greater than 0'
        assert quantity >= 0, 'quantity must be greater than or equal to 0'
        item_type = self.model.item_type

        try:
            older = self.model.read_item(name)
            self.model.update_item(name, price, quantity)
            self.view.display_item_updated(
                name, older['price'], older['quantity'], price, quantity)
        except mvc_exc.ItemNotStored as e:
            self.view.display_item_not_yet_stored_error(name, item_type, e)
            # if the item is not yet stored and we performed an update, we have
            # 2 options: do nothing or call insert_item to add it.
            # self.insert_item(name, price, quantity)

    def update_item_type(self, new_item_type):
        old_item_type = self.model.item_type
        self.model.item_type = new_item_type
        self.view.display_change_item_type(old_item_type, new_item_type)

    def delete_item(self, name):
        item_type = self.model.item_type
        try:
            self.model.delete_item(name)
            self.view.display_item_deletion(name)
        except mvc_exc.ItemNotStored as e:
            self.view.display_item_not_yet_stored_error(name, item_type, e)
```

<a><h2>Test Run</h2></a>
Let's see how everything works together!

Create some items and instantiate a `Controller`.

```python
# model_view_controller.py
my_items = [
    {'name': 'bread', 'price': 0.5, 'quantity': 20},
    {'name': 'milk', 'price': 1.0, 'quantity': 10},
    {'name': 'wine', 'price': 10.0, 'quantity': 5},
]

c = Controller(ModelBasic(my_items), View())
```

Show all items. The `bullet_points` parameter controls which view to display. When you call `c.show_items()` you get this:

```shell
--- PRODUCT LIST ---
1. {'name': 'bread', 'price': 0.5, 'quantity': 20}
2. {'name': 'milk', 'price': 1.0, 'quantity': 10}
3. {'name': 'wine', 'price': 10.0, 'quantity': 5}
```

and when you call `c.show_items(bullet_points=True)` you get this:

```shell
--- PRODUCT LIST ---
* {'name': 'bread', 'price': 0.5, 'quantity': 20}
* {'name': 'milk', 'price': 1.0, 'quantity': 10}
* {'name': 'wine', 'price': 10.0, 'quantity': 5}
```

When you call `c.show_item('chocolate')`, but there is no `'chocolate'`, you get this message:

```shell
**************************************************************
We are sorry, we have no CHOCOLATE!
Can't read "chocolate" because it's not stored
**************************************************************
```

Instead, when you call `c.show_item('bread')`, a different method of the `View` class is called, so you see a different output.

```shell
//////////////////////////////////////////////////////////////
Good news, we have some BREAD!
PRODUCT INFO: {'name': 'bread', 'price': 0.5, 'quantity': 20}
//////////////////////////////////////////////////////////////
```

You are prevented from inserting the same item a second time (e.g. you type `c.insert_item('bread', price=1.0, quantity=5)`).

```shell
**************************************************************
Hey! We already have BREAD in our product list!
"bread" already stored!
**************************************************************
```

But obviously you can add an item which was is not currently stored, for example with: `c.insert_item('chocolate', price=2.0, quantity=10)`.

```shell
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Hooray! We have just added some CHOCOLATE to our product list!
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
```

So now you can call `c.show_item('chocolate')`

```shell
//////////////////////////////////////////////////////////////
Good news, we have some CHOCOLATE!
PRODUCT INFO: {'name': 'chocolate', 'price': 2.0, 'quantity': 10}
//////////////////////////////////////////////////////////////
```

When you update an existing item, for example with `c.update_item('milk', price=1.2, quantity=20)`, you get:

```shell
---   ---   ---   ---   ---   ---   ---   ---   ---   ---   --
Change milk price: 1.0 --> 1.2
Change milk quantity: 10 --> 20
---   ---   ---   ---   ---   ---   ---   ---   ---   ---   --
```

And when you try to update some item which is not stored you get a warning. For example, `c.update_item('ice cream', price=3.5, quantity=20)` will result in the following message:

```shell
**************************************************************
We don't have any ICE CREAM in our product list. Please insert it first!
Can't read "ice cream" because it's not stored
**************************************************************
```

You get a warning also when you try to delete some item which is not stored.

`c.delete_item('fish')`

```shell
**************************************************************
We don't have any FISH in our product list. Please insert it first!
Can't delete "fish" because it's not stored
**************************************************************
```

Finally, when you delete some item which is currently available, for example with `c.delete_item('bread')`, you get this:

```shell
--------------------------------------------------------------
We have just removed bread from our list
--------------------------------------------------------------
```

<a><h2>Conclusion</h2></a>
In this article we saw how to implement a very simple Model-View-Controller pattern. I hope that the implementation of all CRUD operations as simple functions made things a bit easier to understand. However, this MVC application would not be very useful in the real world because there is no _persistence layer_ where to store the data.
In the next article we will replace `ModelBasic` with a different class that uses a SQLite database. As I said, thanks to the flexible architecture provided by the MVC pattern, nothing is going to change neither in the `View`, nor in the `Controller`.
