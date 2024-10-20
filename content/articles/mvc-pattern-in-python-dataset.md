---
date: "2017-04-15"
tags:
  - design patterns
  - Python
title: "MVC pattern in Python: Dataset"
---

This is the **third** article of a series of blog posts related to the MVC pattern. In the first article we saw how to divide business logic, presentation layer and user interaction into three components: Model, View and Controller. Last time we replaced the Model without touching a single line of code neither in the View, nor in the Controller.

This time we are going to replace the Model once again, but instead of using a database directly, we are going to use a small [ORM](https://en.wikipedia.org/wiki/Object-relational_mapping) called [Dataset](https://dataset.readthedocs.io/en/latest/).

Here are the links to the other articles in the series:

1. [MVC pattern in Python: Introduction and BasicModel](https://www.giacomodebidda.com/posts/mvc-pattern-in-python-introduction-and-basicmodel/)
2. [MVC pattern in Python: SQLite](https://www.giacomodebidda.com/posts/mvc-pattern-in-python-sqlite/)
3. [MVC pattern in Python: Dataset](https://www.giacomodebidda.com/posts/mvc-pattern-in-python-dataset/)

_All code was written in Python 3.5. If you are using Python 2.7 you should be able to run it with a few minor changes._

---

Table of contents

1. <a href="#intro">Introduction</a>
2. <a href="#crud">CRUD</a>
3. <a href="#postgres">Switch to PostgreSQL</a>
4. <a href="#model">Model</a>
5. <a href="#view-controller">View and Controller</a>
6. <a href="#conclusion">Conclusion</a>

<a><h2>Introduction</h2></a>
First of all, if you haven't read the first article in the MVC series, I suggest you to read that one first, otherwise many of the things here will not make much sense. Moreover, you will need the code for the `View` and the `Controller`.

Dataset is a small abstraction layer built on top of the most popular Python ORM, [SqlAlchemy](https://www.sqlalchemy.org/) (interestingly enough, on GitHub [Dataset](https://github.com/pudo/dataset/) has even more stars than [SqlAlchemy](https://github.com/zzzeek/sqlalchemy) itself!). I stumbled upon this project when I was playing around with [Kivy](https://kivy.org/#home) and I needed to store a few records. It was just a small application and I didn't want to use a database, so I thought about using the [JSON Storage](https://kivy.org/docs/api-kivy.storage.jsonstore.html) module of the Kivy framework itself. That worked, but I didn't like it too much, so I started looking for a better alternative.

As they say in their [awesome documentation](https://dataset.readthedocs.io/en/latest/), with Dataset you can use databases just like you would use a JSON file or a NoSQL store. And the cool thing is that your code will stay basically the same, no matter which database engine you want to use (at this time Dataset supports SQLite, PostgreSQL and MySQL).

In this article I will show you how to use SQLite and PostgreSQL with Dataset.

<a><h2>CRUD</h2></a>
As we did last time, let's implement each CRUD functionality in the simplest way possible.

Let's review the inventory of a small grocery store. A typical product list would look like this:

{% table %}
Name,Price,Quantity
Bread,0.5,20
Milk,1.0,10
Wine,10.0,5
{% endtable %}

Create a Python script and call it `dataset_backend.py`.

The first thing to do is to connect to a database. With Dataset you just need a [single line of code](https://dataset.readthedocs.io/en/latest/api.html#dataset.connect). Let's connect to an in-memory SQLite database with:

```python
import dataset
conn = dataset.connect('sqlite:///:memory:')
```

`dataset.connect` returns an instance of class `Database`, an object that represents a SQL database with multiple tables, and opens a new connection to this database. No need to worry about connection timeouts or disconnections.

Ok, now you need to create a table. Forget about SQL statements and Data Definition Language: with Dataset you have _automatic schema_, so you don't have to specify any datatype in advance.

```python
# dataset_backend.py
from sqlalchemy.exc import NoSuchTableError

def create_table(conn, table_name):
    """Load a table or create it if it doesn't exist yet.

    The function load_table can only load a table if exist, and raises a NoSuchTableError if the table does not already exist in the database.

    The function get_table either loads a table or creates it if it doesn't exist yet. The new table will automatically have an id column unless specified via optional parameter primary_id, which will be used as the primary key of the table.

    Parameters
    ----------
    table_name : str
    conn : dataset.persistence.database.Database
    """
    try:
        conn.load_table(table_name)
    except NoSuchTableError as e:
        print('Table {} does not exist. It will be created now'.format(e))
        conn.get_table(table_name, primary_id='name', primary_type='String')
        print('Created table {} on database {}'.format(table_name, DB_name))
```

Here is the code for CRUD operations.

_Create_

```python
# dataset_backend.py
from sqlalchemy.exc import IntegrityError, NoSuchTableError
import mvc_exceptions as mvc_exc

def insert_one(conn, name, price, quantity, table_name):
    """Insert a single item in a table.

    Parameters
    ----------
    name : str
    price : float
    quantity : int
    table_name : dataset.persistence.table.Table
    conn : dataset.persistence.database.Database

    Raises
    ------
    mvc_exc.ItemAlreadyStored: if the record is already stored in the table.
    """
    table = conn.load_table(table_name)
    try:
        table.insert(dict(name=name, price=price, quantity=quantity))
    except IntegrityError as e:
        raise mvc_exc.ItemAlreadyStored(
            '"{}" already stored in table "{}".\nOriginal Exception raised: {}'
            .format(name, table.table.name, e))


def insert_many(conn, items, table_name):
    """Insert all items in a table.

    Parameters
    ----------
    items : list
        list of dictionaries
    table_name : str
    conn : dataset.persistence.database.Database
    """
    # TODO: check what happens if 1+ records can be inserted but 1 fails
    table = conn.load_table(table_name)
    try:
        for x in items:
            table.insert(dict(
                name=x['name'], price=x['price'], quantity=x['quantity']))
    except IntegrityError as e:
        print('At least one in {} was already stored in table "{}".\nOriginal '
              'Exception raised: {}'
              .format([x['name'] for x in items], table.table.name, e))
```

_Read_

```python
# dataset_backend.py
def select_one(conn, name, table_name):
    """Select a single item in a table.

    The dataset library returns a result as an OrderedDict.

    Parameters
    ----------
    name : str
        name of the record to look for in the table
    table_name : str
    conn : dataset.persistence.database.Database

    Raises
    ------
    mvc_exc.ItemNotStored: if the record is not stored in the table.
    """
    table = conn.load_table(table_name)
    row = table.find_one(name=name)
    if row is not None:
        return dict(row)
    else:
        raise mvc_exc.ItemNotStored(
            'Can\'t read "{}" because it\'s not stored in table "{}"'.format(name, table.table.name))


def select_all(conn, table_name):
    """Select all items in a table.

    The dataset library returns results as OrderedDicts.

    Parameters
    ----------
    table_name : str
    conn : dataset.persistence.database.Database

    Returns
    -------
    list
        list of dictionaries. Each dict is a record.
    """
    table = conn.load_table(table_name)
    rows = table.all()
    return list(map(lambda x: dict(x), rows))
```

_Update_

```python
# dataset_backend.py
def update_one(conn, name, price, quantity, table_name):
    """Update a single item in the table.

    Note: dataset update method is a bit counterintuitive to use. Read the docs here: https://dataset.readthedocs.io/en/latest/quickstart.html#storing-data
    Dataset has also an upsert functionality: if rows with matching keys exist they will be updated, otherwise a new row is inserted in the table.

    Parameters
    ----------
    name : str
    price : float
    quantity : int
    table_name : str
    conn : dataset.persistence.database.Database

    Raises
    ------
    mvc_exc.ItemNotStored: if the record is not stored in the table.
    """
    table = conn.load_table(table_name)
    row = table.find_one(name=name)
    if row is not None:
        item = {'name': name, 'price': price, 'quantity': quantity}
        table.update(item, keys=['name'])
    else:
        raise mvc_exc.ItemNotStored(
            'Can\'t update "{}" because it\'s not stored in table "{}"'.format(name, table.table.name))
```

_Delete_

```python
# dataset_backend.py
def delete_one(conn, item_name, table_name):
    """Delete a single item in a table.

    Parameters
    ----------
    item_name : str
    table_name : str
    conn : dataset.persistence.database.Database

    Raises
    ------
    mvc_exc.ItemNotStored: if the record is not stored in the table.
    """
    table = conn.load_table(table_name)
    row = table.find_one(name=item_name)
    if row is not None:
        table.delete(name=item_name)
    else:
        raise mvc_exc.ItemNotStored(
            'Can\'t delete "{}" because it\'s not stored in table "{}"'.format(item_name, table.table.name))
```

Let's put everything together and see if these CRUD operations are correct!

```python
# dataset_backend.py
def main():

    conn = dataset.connect('sqlite:///:memory:')

    table_name = 'items'
    create_table(conn, table_name)

    # CREATE
    my_items = [
        {'name': 'bread', 'price': 0.5, 'quantity': 20},
        {'name': 'milk', 'price': 1.0, 'quantity': 10},
        {'name': 'wine', 'price': 10.0, 'quantity': 5},
    ]

    insert_many(conn, items=my_items, table_name=table_name)
    insert_one(conn, 'beer', price=2.0, quantity=5, table_name=table_name)
    # if we try to insert an object already stored we get an ItemAlreadyStored exception
    # insert_one(conn, 'beer', 2.0, 5, table_name=table_name)

    # READ
    print('SELECT milk')
    print(select_one(conn, 'milk', table_name=table_name))
    print('SELECT all')
    print(select_all(conn, table_name=table_name))
    # if we try to select an object not stored we get an ItemNotStored exception
    # print(select_one(conn, 'pizza', table_name=table_name))

    # UPDATE
    print('UPDATE bread, SELECT bread')
    update_one(conn, 'bread', price=1.5, quantity=5, table_name=table_name)
    print(select_one(conn, 'bread', table_name=table_name))
    # if we try to update an object not stored we get an ItemNotStored exception
    # print('UPDATE pizza')
    # update_one(conn, 'pizza', 9.5, 5, table_name=table_name)

    # DELETE
    print('DELETE beer, SELECT all')
    delete_one(conn, 'beer', table_name=table_name)
    print(select_all(conn, table_name=table_name))
    # if we try to delete an object not stored we get an ItemNotStored exception
    # print('DELETE fish')
    # delete_one(conn, 'fish', table_name=table_name)

if __name__ == '__main__':
    main()
```

<a><h2>Switch to PostgreSQL</h2></a>
OK cool, now that we tested all CRUD operations on a SQLite database, let's try to switch to PostgreSQL.

If you need to setup PostgreSQL on your machine have a look at [this post](https://www.giacomodebidda.com/posts/first-steps-with-postgresql/), otherwise just open a terminal and create a new Postgres user:

```shell
sudo -i -u postgres
createuser --interactive
>>> Enter name of role to add: test_user
>>> Shall the new role be a superuser? (y/n) y
```

then go the `psql` shell, assign a password to this user and create a database.

```shell
ALTER USER test_user WITH PASSWORD 'test_password';
CREATE DATABASE test_db;
```

In the `psql` shell you can double check that this new database and user are available by typing `\l` and `\du`, respectively. Exit the `psql` shell with `\q`.

In the `dataset_backend.py` file, create a new function to connect to the database, so you can easily switch back and forth between SQLite and PostgreSQL.

```python
# dataset_backend.py
DB_name = 'test_db'


class UnsupportedDatabaseEngine(Exception):
    pass


def connect_to_db(db_name=None, db_engine='sqlite'):
    """Connect to a database. Create the database if there isn't one yet.

    The database can be a SQLite DB (either a DB file or an in-memory DB), or a PostgreSQL DB. In order to connect to a PostgreSQL DB you have first to create a database, create a user, and finally grant him all necessary privileges on that database and tables.
    'postgresql://<username>:<password>@localhost:<PostgreSQL port>/<db name>'
    Note: at the moment it looks it's not possible to close a connection manually (e.g. like calling conn.close() in sqlite3).


    Parameters
    ----------
    db_name : str or None
        database name (without file extension .db)
    db_engine : str
        database engine ('sqlite' or 'postgres')

    Returns
    -------
    dataset.persistence.database.Database
        connection to a database
    """
    engines = set('sqlite', 'postgres')
    if db_name is None:
        db_string = 'sqlite:///:memory:'
        print('New connection to in-memory SQLite DB...')
    else:
        if db_engine == 'sqlite':
            db_string = 'sqlite:///{}.db'.format(DB_name)
            print('New connection to SQLite DB...')
        elif db_engine == 'postgres':
            db_string = \
                'postgresql://test_user:test_password@localhost:5432/{}'.format(DB_NAME)
            print('New connection to PostgreSQL DB...')
        else:
            raise UnsupportedDatabaseEngine(
                'No database engine with this name. '
                'Choose one of the following: {}'.format(engines))

    return dataset.connect(db_string)
```

If you now replace this line in the `main` function:

```python
conn = dataset.connect('sqlite:///:memory:')
```

with this line

```python
conn = connect_to_db(db_name='test_db', db_engine='postgres')
```

you should be able to perform all CRUD operations on a PostgreSQL database, instead of SQLite.

How cool is that? With a single line we completely switched database engine!

<a><h2>Model</h2></a>
Now that all CRUD operations are implemented as simple functions, creating a class for a Model that uses a SQLite database as persistence layer is pretty straightforward.

```python
# model_view_controller.py
import dataset_backend
import mvc_exceptions as mvc_exc


class ModelDataset(object):

    def __init__(self, application_items):
        self._item_type = 'product'
        self._connection = dataset_backend.connect_to_db(
            dataset_backend.DB_name, db_engine='postgres')
        dataset_backend.create_table(self.connection, self._item_type)
        self.create_items(application_items)

    @property
    def item_type(self):
        return self._item_type

    @item_type.setter
    def item_type(self, new_item_type):
        self._item_type = new_item_type

    @property
    def connection(self):
        return self._connection

    def create_item(self, name, price, quantity):
        dataset_backend.insert_one(
            self.connection, name, price, quantity, table_name=self.item_type)

    def create_items(self, items):
        dataset_backend.insert_many(
            self.connection, items, table_name=self.item_type)

    def read_item(self, name):
        return dataset_backend.select_one(
            self.connection, name, table_name=self.item_type)

    def read_items(self):
        return dataset_backend.select_all(
            self.connection, table_name=self.item_type)

    def update_item(self, name, price, quantity):
        dataset_backend.update_one(
            self.connection, name, price, quantity, table_name=self.item_type)

    def delete_item(self, name):
        dataset_backend.delete_one(
            self.connection, name, table_name=self.item_type)
```

<a><h2>View and Controller</h2></a>
`View` and `Controller` are completely **decoupled** from the `Model` (and between themselves), so you don't need to change anything in their implementation. If you need the code for these classes, see the [first article](https://www.giacomodebidda.com/posts/mvc-pattern-in-python-introduction-and-basicmodel/) in the series.

The only thing to do is to plug the `ModelDataset` in the `Controller`.

Here is a snippet to test our small MVC application:

```python
if __name__ == '__main__':

    my_items = [
        {'name': 'bread', 'price': 0.5, 'quantity': 20},
        {'name': 'milk', 'price': 1.0, 'quantity': 10},
        {'name': 'wine', 'price': 10.0, 'quantity': 5},
    ]

    c = Controller(ModelDataset(my_items), View())

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
```

<a><h2>Conclusion</h2></a>
In this article we implemented an ORM-based backend for the _Model_ component of the MVC architecture. Thanks to the Dataset package, we can switch from SQLite (maybe for _development_) to PostgreSQL (maybe for _production_) very easily.

Dataset is a really cool project and I strongly suggest you to check it out. You can go through the awesome [quickstart in 12 minutes](https://dataset.readthedocs.io/en/latest/quickstart.html).

Ah, just in case you want to cleanup your postgres, open the `psql` shell as user `postgres` and drop the test database and test user with the following statements:

```shell
DROP DATABASE test_db;
DROP USER test_user;
```
