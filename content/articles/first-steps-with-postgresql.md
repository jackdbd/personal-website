---
date: "2017-03-13"
tags:
  - postgreSQL
title: First steps with PostgreSQL
---

In a Django project, PostgreSQL is probably the most popular choice when it comes to deploy a database for a production environment. In this article I'll go through the necessary steps to set it up on Ubuntu, along with a list of some basic commands to create databases and tables, as well as manage _roles_ (i.e. users).

Here I will create a new role called `test_user` and a new database called `test_db`. You can pick different names if you want, but try to avoid mixing lowercase/uppercase. This is because if you create a user with a mix of lowercase and uppercase characters (e.g. `test_User`) you will need to type the double quotation marks every time.

## Dependencies

To satisfy the dependencies of the operative system, open a terminal and type:

```shell
sudo apt-get install postgresql postgresql-contrib libpq-dev python-dev
```

For the python dependencies, I'd suggest to create a virtual environment with [virtualenv](https://virtualenv.pypa.io/en/stable/), or even better with [virtualenvwrapper](https://www.giacomodebidda.com/posts/virtual-environments-with-virtualenvwrapper/), and install the `psycopg2` driver:

```shell
pip install psycopg2
```

## The postgres shell

`psql` is the interactive terminal for working with PostgreSQL. You can launch it with `sudo -i -u postgres` and then `psql`.

Here are some useful commands when using the `psql` shell:

* **\du** list all roles (namely the users) and their privileges;
* **\l** list all databases, their owners and access privileges;
* **\c [DB NAME]** connect to the **[DB NAME]** database with the user currently logged in;
* **\d** list all the tables of the database you are currently connected to;
* **\d [TABLE NAME]** show the schema of the table **[TABLE NAME]**, of the database you are currently connected to;
* **\h** help on SQL commands;
* **\?** help on psql commands;
* **\conninfo** show some information about the current database connection (db name and user name);
* **\q** exit the psql shell.

## Create a new user (aka role)

PostgreSQL comes with a default user called `postgres`, which is the root user. Let's create a new user.

As user `postgres`, exit the `psql` shell and type:

```shell
createuser --interactive
```

Choose a username (e.g. `test_user`) and decide whether this user should be a superuser, should be allowed to create new databases and/or new roles.

```shell
Enter name of role to add: test_user
Shall the new role be a superuser? (y/n) n
Shall the new role be allowed to create databases? (y/n) y
Shall the new role be allowed to create more new roles? (y/n) y
```

If you want to check that the user was created correctly, go back to the `psql` shell and type `\du`.

## Assign a password to your new user

In the `psql` shell, type:

```sql
ALTER USER test_user WITH PASSWORD 'test_password';
```

Don't forget the semi-colon and [avoid double quotation marks](https://lerner.co.il/2013/11/30/quoting-postgresql/).

## Create a database

In the `psql` shell, as user `postgres`, type:

```sql
CREATE DATABASE test_db;
```

This command creates a new database called `test_db`. At this moment, only the user `postgres` can perform operations on this database.

## Create a table

```sql
CREATE TABLE items(
    item_id serial PRIMARY KEY,
    item_description text NOT NULL,
    item_added timestamp DEFAULT NULL
);
```

## Assign privileges to `test_user`

You need to allow your new user to modify the content of the `test_db` database. In order to do so you will need to grant him privileges on the database itself, and on the tables available in the database.

```sql
GRANT ALL PRIVILEGES ON DATABASE test_db TO test_user;
```

The main reason to grant privileges on the database is to allow or revoke the connection to the database, but in order to allow for changes in the content of the database itself, the user `test_user` needs the privileges on all the tables he is allowed to modify. So, if you want to allow `test_user` to edit the contents of the table `items`, connect to the database with `\c test_db` and assign the privileges with:

```sql
GRANT ALL PRIVILEGES ON TABLE items TO test_user;
```

Instead of typing the two aforementioned commands, you can achieve the same result with a single command:

```sql
GRANT ALL ON items TO test_user;
```

Ok, now `test_user` can connect to `test_db` and change its content. If he is the only user allowed to work on this database, it make sense to make him the owner:

```sql
ALTER DATABASE test_db OWNER TO test_user;
```

## Connect to `test_db` with `test_user`

You are still connected as user `postgres`. Exit the `psql` shell with `\q` and log in with `test_user` (you will need to type the password).

```shell
psql -h localhost -U test_user -d test_db
```

Here is what you should see if you type `\conninfo`:

```shell
test_db=> \conninfo
You are connected to database "test_db" as user "test_user" on host "localhost" at port "5432".
SSL connection (protocol: TLSv1.2, cipher: ECDHE-RSA-AES256-GCM-SHA384, bits: 256, compression: off)
```

## Cleanup

Probably you don't want to keep the user, the database and the table we have just created, so let's remove them. Keep in mind that you cannot drop an open database, nor you can drop it if you are not the database owner or a superuser. So, exit the `psql` shell and re-log into it as user `postgres` (you just have to type `psql`).

```sql
DROP TABLE items;
DROP DATABASE test_db;
DROP USER test_user;
```

## References

Here are some additional resources:

* [psql](https://www.postgresguide.com/utilities/psql/)
* [How to secure PostgreSQL on a Ubuntu VPS](https://www.digitalocean.com/community/tutorials/how-to-secure-postgresql-on-an-ubuntu-vps)
* [backup and restore postgreSQL databases with Barman](https://www.digitalocean.com/community/tutorials/how-to-back-up-restore-and-migrate-postgresql-databases-with-barman-on-centos-7)
