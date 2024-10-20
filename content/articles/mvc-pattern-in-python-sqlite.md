---
date: "2017-04-10"
tags:
  - design patterns
  - Python
title: "MVC pattern in Python: SQLite"
---

This is the **second** article of a series of blog posts related to the MVC pattern. Last time we saw how to divide business logic, presentation layer and user interaction into three components: Model, View and Controller.

This time we are going to replace the Model and implement a persistence layer with a SQLite database.

Here are the links to the other articles in the series:

1. [MVC pattern in Python: Introduction and BasicModel](https://www.giacomodebidda.com/posts/mvc-pattern-in-python-introduction-and-basicmodel/)
2. [MVC pattern in Python: SQLite](https://www.giacomodebidda.com/posts/mvc-pattern-in-python-sqlite/)
3. [MVC pattern in Python: Dataset](https://www.giacomodebidda.com/posts/mvc-pattern-in-python-dataset/)

_All code was written in Python 3.5. If you are using Python 2.7 you should be able to run it with a few minor changes._

---

Table of contents

1. <a href="#intro">Introduction</a>
2. <a href="#crud">CRUD</a>
3. <a href="#model">Model</a>
4. <a href="#view-controller">View and Controller</a>
5. <a href="#conclusion">Conclusion</a>

<a><h2>Introduction</h2></a>
First of all, if you haven't read my previous article in the MVC series, I suggest you to read that one first, otherwise many of the things here will not make much sense. Moreover, you will need the code for the `View` and the `Controller`.

<a><h2>CRUD</h2></a>
Let's review the inventory of a small grocery store. A typical product list would look like this:

{% table %}
Name,Price,Quantity
Bread,0.5,20
Milk,1.0,10
Wine,10.0,5
{% endtable %}

In this article we will use SQLite and store all these products in a database table.

As we did last time, let's implement each CRUD functionality in the simplest way possible. Create a python script and call it `sqlite_backend.py`.
Actually, even before writing any code for CRUD operations, we have to write some code to handle database connections.

A great feature of SQLite is that you can create in-memory databases. An in-memory database runs in the RAM of your computer, so it lets you develop and test your code much faster than a "normal" database.

A "normal", physical SQLite database is just a file, and this makes using SQLite a joy: even if you mess up, you can simply delete your `.db` file and start over.

The code to establish a connection to SQLite3 is pretty straightforward and doesn't change either if you are using an in-memory database or a physical one.

```python
import sqlite3

DB_name = 'myDB'


def connect_to_db(db=None):
    """Connect to a sqlite DB. Create the database if there isn't one yet.

    Open a connection to a SQLite DB (either a DB file or an in-memory DB).
    When a database is accessed by multiple connections, and one of the
    processes modifies the database, the SQLite database is locked until that
    transaction is committed.

    Parameters
    ----------
    db : str
        database name (without .db extension). If None, create an In-Memory DB.

    Returns
    -------
    connection : sqlite3.Connection
        connection object
    """
    if db is None:
        mydb = ':memory:'
        print('New connection to in-memory SQLite DB...')
    else:
        mydb = '{}.db'.format(db)
        print('New connection to SQLite DB...')
    connection = sqlite3.connect(mydb)
    return connection
```

As you can see, `connect_to_db` returns a `connection`, an object that you will need to pass as argument to each database operation.

Let's say that you have the following requirement for your application: each database operation should be able to open a connection if there isn't one already. How would you do it?

You could call `connect_to_db` at the beginning of each database operation, but this would open a new database connection for each operation, every time. This doesn't sound too smart, and you should try to reuse a connection that already exists.

You could place a `try/except` block at the beginning of each database operation, but you would end up with a lot of ugly, [duplicate code](https://stackoverflow.com/a/2298357).

Luckily, in Python there is a better alternative: a decorator.
The `try/except` block in the code below is dead simple. We just try a very fast query. If it succeeds, it means that there is an open connection that we can use. If it fails, it means that there is no connection or that the connection is closed, and we have to open a new one.

```python
# sqlite_backend.py
from sqlite3 import OperationalError, IntegrityError, ProgrammingError


# TODO: use this decorator to wrap commit/rollback in a try/except block ?
# see https://www.kylev.com/2009/05/22/python-decorators-and-database-idioms/
def connect(func):
    """Decorator to (re)open a sqlite database connection when needed.

    A database connection must be open when we want to perform a database query
    but we are in one of the following situations:
    1) there is no connection
    2) the connection is closed

    Parameters
    ----------
    func : function
        function which performs the database query

    Returns
    -------
    inner func : function
    """
    def inner_func(conn, *args, **kwargs):
        try:
            # I don't know if this is the simplest and fastest query to try
            conn.execute(
                'SELECT name FROM sqlite_temp_master WHERE type="table";')
        except (AttributeError, ProgrammingError):
            conn = connect_to_db(DB_name)
        return func(conn, *args, **kwargs)
    return inner_func
```

A SQLite database will close a connection automatically after a certain _timeout_ (the default [timeout](https://docs.python.org/2/library/sqlite3.html#sqlite3.connect) is 5s). However, sometimes you may want to disconnect from a database explicitly.

```python
# sqlite_backend.py
def disconnect_from_db(db=None, conn=None):
    if db is not DB_name:
        print("You are trying to disconnect from a wrong DB")
    if conn is not None:
        conn.close()
```

There is still another thing you need to do before starting to write code to implement any CRUD operation: you need a table!

Your table must contain data about `name`, `price` and `quantity` of every single item. Given the dynamic nature of the Python language, you don't have to assign a type to any of these three attributes. However, most likely `name` would be a `str`, `price` a `float` and `quantity` an `int`.

In SQLite there are both ["storage classes" and "datatypes"](https://sqlite.org/datatype3.html), but for the most part, "storage class" is indistinguishable from "datatype" and the two terms can be used interchangeably. So, which storage class should you assign to `name`, `price`, `quantity`? I think a good choice is: `TEXT`, `REAL` and `INTEGER`, respectively.

_Note that here we are defining a table, so we use a [Data Definition Language](https://en.wikipedia.org/wiki/Data_definition_language) and [there is no need to explicitly commit](https://stackoverflow.com/questions/730621/do-ddl-statements-always-give-you-an-implicit-commit-or-can-you-get-an-implicit)_

```python
# sqlite_backend.py
@connect
def create_table(conn, table_name):
    sql = 'CREATE TABLE {} (rowid INTEGER PRIMARY KEY AUTOINCREMENT,' \
          'name TEXT UNIQUE, price REAL, quantity INTEGER)'.format(table_name)
    try:
        conn.execute(sql)
    except OperationalError as e:
        print(e)
```

I'm definitely not an expert in databases, but something which is widely known is that an attacker could insert malicious SQL statements into an entry field of your application, a vulnerability called [SQL injection](https://en.wikipedia.org/wiki/SQL_injection). This is just a toy application and I don't think it makes sense discussing this issue, however some time ago I found a nice snippet to try to prevent SQL injection (actually I don't remember where I found it, probably Stack Overflow).

```python
# sqlite_backend.py
def scrub(input_string):
    """Clean an input string (to prevent SQL injection).

    Parameters
    ----------
    input_string : str

    Returns
    -------
    str
    """
    return ''.join(k for k in input_string if k.isalnum())
```

You can use the `scrub` function to clean the `table_name` string.

```python
# sqlite_backend.py
@connect
def create_table(conn, table_name):
    table_name = scrub(table_name)
    sql = 'CREATE TABLE {} (rowid INTEGER PRIMARY KEY AUTOINCREMENT,' \
          'name TEXT UNIQUE, price REAL, quantity INTEGER)'.format(table_name)
    try:
        conn.execute(sql)
    except OperationalError as e:
        print(e)
```

Now that we finally have a table, let's start to implement the CRUD functionalities.

Let's start with the _Create_ functionality.

```python
# sqlite_backend.py
@connect
def insert_one(conn, name, price, quantity, table_name):
    table_name = scrub(table_name)
    sql = "INSERT INTO {} ('name', 'price', 'quantity') VALUES (?, ?, ?)"\
        .format(table_name)
    try:
        conn.execute(sql, (name, price, quantity))
        conn.commit()
    except IntegrityError as e:
        raise mvc_exc.ItemAlreadyStored(
            '{}: "{}" already stored in table "{}"'.format(e, name, table_name))


@connect
def insert_many(conn, items, table_name):
    table_name = scrub(table_name)
    sql = "INSERT INTO {} ('name', 'price', 'quantity') VALUES (?, ?, ?)"\
        .format(table_name)
    entries = list()
    for x in items:
        entries.append((x['name'], x['price'], x['quantity']))
    try:
        conn.executemany(sql, entries)
        conn.commit()
    except IntegrityError as e:
        print('{}: at least one in {} was already stored in table "{}"'
              .format(e, [x['name'] for x in items], table_name))
```

As you can see, _Create_ operations don't return anything. They just insert data into the database.

Let's now add a _Read_ functionality, but first there is a small thing to do: if you remember, last time each item was represented as a Python `dict`;

```python
my_items = [
    {'name': 'bread', 'price': 0.5, 'quantity': 20},
    {'name': 'milk', 'price': 1.0, 'quantity': 10},
    {'name': 'wine', 'price': 10.0, 'quantity': 5},
]
```

this time, each query that returns an item will return a `tuple`, and you will need to convert such tuple into a dict.

```python
# sqlite_backend.py
def tuple_to_dict(mytuple):
    mydict = dict()
    mydict['id'] = mytuple[0]
    mydict['name'] = mytuple[1]
    mydict['price'] = mytuple[2]
    mydict['quantity'] = mytuple[3]
    return mydict
```

In a SQL database, _Read_ operations are performed with `SELECT` statements.

```python
# sqlite_backend.py
@connect
def select_one(conn, item_name, table_name):
    table_name = scrub(table_name)
    item_name = scrub(item_name)
    sql = 'SELECT * FROM {} WHERE name="{}"'.format(table_name, item_name)
    c = conn.execute(sql)
    result = c.fetchone()
    if result is not None:
        return tuple_to_dict(result)
    else:
        raise mvc_exc.ItemNotStored(
            'Can\'t read "{}" because it\'s not stored in table "{}"'
            .format(item_name, table_name))


@connect
def select_all(conn, table_name):
    table_name = scrub(table_name)
    sql = 'SELECT * FROM {}'.format(table_name)
    c = conn.execute(sql)
    results = c.fetchall()
    return list(map(lambda x: tuple_to_dict(x), results))
```

Let's now add the _Update_ operation.

```python
# sqlite_backend.py
@connect
def update_one(conn, name, price, quantity, table_name):
    table_name = scrub(table_name)
    sql_check = 'SELECT EXISTS(SELECT 1 FROM {} WHERE name=? LIMIT 1)'\
        .format(table_name)
    sql_update = 'UPDATE {} SET price=?, quantity=? WHERE name=?'\
        .format(table_name)
    c = conn.execute(sql_check, (name,))  # we need the comma
    result = c.fetchone()
    if result[0]:
        c.execute(sql_update, (price, quantity, name))
        conn.commit()
    else:
        raise mvc_exc.ItemNotStored(
            'Can\'t update "{}" because it\'s not stored in table "{}"'
            .format(name, table_name))
```

And finally, _Delete_.

```python
# sqlite_backend.py
@connect
def delete_one(conn, name, table_name):
    table_name = scrub(table_name)
    sql_check = 'SELECT EXISTS(SELECT 1 FROM {} WHERE name=? LIMIT 1)'\
        .format(table_name)
    table_name = scrub(table_name)
    sql_delete = 'DELETE FROM {} WHERE name=?'.format(table_name)
    c = conn.execute(sql_check, (name,))  # we need the comma
    result = c.fetchone()
    if result[0]:
        c.execute(sql_delete, (name,))  # we need the comma
        conn.commit()
    else:
        raise mvc_exc.ItemNotStored(
            'Can\'t delete "{}" because it\'s not stored in table "{}"'
            .format(name, table_name))
```

Let's put everything together and see if these CRUD operations are correct!

```python
# sqlite_backend.py
def main():

    table_name = 'items'
    conn = connect_to_db()  # in-memory database
    # conn = connect_to_db(DB_name)  # physical database (i.e. a .db file)

    create_table(conn, table_name)

    my_items = [
        {'name': 'bread', 'price': 0.5, 'quantity': 20},
        {'name': 'milk', 'price': 1.0, 'quantity': 10},
        {'name': 'wine', 'price': 10.0, 'quantity': 5},
    ]

    # CREATE
    insert_many(conn, my_items, table_name='items')
    insert_one(conn, 'beer', price=2.0, quantity=5, table_name='items')
    # if we try to insert an object already stored we get an ItemAlreadyStored
    # exception
    # insert_one(conn, 'milk', price=1.0, quantity=3, table_name='items')

    # READ
    print('SELECT milk')
    print(select_one(conn, 'milk', table_name='items'))
    print('SELECT all')
    print(select_all(conn, table_name='items'))
    # if we try to select an object not stored we get an ItemNotStored exception
    # print(select_one(conn, 'pizza', table_name='items'))

    # conn.close()  # the decorator @connect will reopen the connection

    # UPDATE
    print('UPDATE bread, SELECT bread')
    update_one(conn, 'bread', price=1.5, quantity=5, table_name='items')
    print(select_one(conn, 'bread', table_name='items'))
    # if we try to update an object not stored we get an ItemNotStored exception
    # print('UPDATE pizza')
    # update_one(conn, 'pizza', price=1.5, quantity=5, table_name='items')

    # DELETE
    print('DELETE beer, SELECT all')
    delete_one(conn, 'beer', table_name='items')
    print(select_all(conn, table_name='items'))
    # if we try to delete an object not stored we get an ItemNotStored exception
    # print('DELETE fish')
    # delete_one(conn, 'fish', table_name='items')

    # save (commit) the changes
    # conn.commit()

    # close connection
    conn.close()

if __name__ == '__main__':
    main()
```

You can execute the `main` function with this line:

```python
conn = connect_to_db()  # in-memory database
```

or this one:

```python
conn = connect_to_db(DB_name)  # physical database (i.e. a .db file)
```

Th former creates an in-memory database, so it's faster and does not create any file. The latter creates a `.db` file that you can explore with tools like [DB Browser for SQLite](https://sqlitebrowser.org/) or even online viewers like [this one](https://inloop.github.io/sqlite-viewer/).

<a><h2>Model</h2></a>
Now that all CRUD operations are implemented as simple functions, creating a class for a Model that uses a SQLite database as persistence layer is pretty straightforward.

```python
# model_view_controller.py
import sqlite_backend
import mvc_exceptions as mvc_exc


class ModelSQLite(object):

    def __init__(self, application_items):
        self._item_type = 'product'
        self._connection = sqlite_backend.connect_to_db(sqlite_backend.DB_name)
        sqlite_backend.create_table(self.connection, self._item_type)
        self.create_items(application_items)

    @property
    def connection(self):
        return self._connection

    @property
    def item_type(self):
        return self._item_type

    @item_type.setter
    def item_type(self, new_item_type):
        self._item_type = new_item_type

    def create_item(self, name, price, quantity):
        sqlite_backend.insert_one(
            self.connection, name, price, quantity, table_name=self.item_type)

    def create_items(self, items):
        sqlite_backend.insert_many(
            self.connection, items, table_name=self.item_type)

    def read_item(self, name):
        return sqlite_backend.select_one(
            self.connection, name, table_name=self.item_type)

    def read_items(self):
        return sqlite_backend.select_all(
            self.connection, table_name=self.item_type)

    def update_item(self, name, price, quantity):
        sqlite_backend.update_one(
            self.connection, name, price, quantity, table_name=self.item_type)

    def delete_item(self, name):
        sqlite_backend.delete_one(
            self.connection, name, table_name=self.item_type)
```

<a><h2>View and Controller</h2></a>
As I said last time, `View` and `Controller` are completely **decoupled** from the `Model` (and between themselves), so you don't need to change anything in their implementation. If you need the code for these classes, see the [first article](https://www.giacomodebidda.com/posts/mvc-pattern-in-python-introduction-and-basicmodel/) in the series.

The only thing to do is to plug the `ModelSQLite` in the `Controller`.

Here is a snippet to test our small MVC application:

```python
if __name__ == '__main__':

    my_items = [
        {'name': 'bread', 'price': 0.5, 'quantity': 20},
        {'name': 'milk', 'price': 1.0, 'quantity': 10},
        {'name': 'wine', 'price': 10.0, 'quantity': 5},
    ]

    c = Controller(ModelSQLite(my_items), View())
    c.show_items()
    c.show_items(bullet_points=True)
    c.show_item('chocolate')
    c.show_item('bread')

    c.insert_item('bread', price=1.0, quantity=5)
    c.insert_item('chocolate', price=2.0, quantity=10)
    c.show_item('chocolate')

    c.update_item('milk', price=1.2, quantity=20)
    c.update_item('ice cream', price=3.5, quantity=20)

    c.delete_item('fish')
    c.delete_item('bread')

    c.show_items()

    # we close the current sqlite database connection explicitly
    if type(c.model) is ModelSQLite:
        sqlite_backend.disconnect_from_db(
            sqlite_backend.DB_name, c.model.connection)
        # the sqlite backend understands that it needs to open a new connection
        c.show_items()
```

<a><h2>Conclusion</h2></a>
In this article we replaced `ModelBasic` with `ModelSQLite`. Thanks to the SQLite database we gained a persistence layer for our application, and thanks to the modular architecture of the MVC pattern we kept the same functionality without having to change a single line of code in the `View` or in the `Controller`.

In the next article we will use a very cool package called [Dataset](https://dataset.readthedocs.io/en/latest/) to get rid of all these ugly SQL statements! We will be able to simplify all these database operations and make the code more pythonic.
