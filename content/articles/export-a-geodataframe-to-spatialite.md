---
date: '2018-08-21T21:00:03.284Z'
ogp:
  image: https://res.cloudinary.com/jackdbd/image/upload/v1599302022/spatialite-gui_xgzx3z.png
  imageAlt: A map preview in Spatialite GUI.
tags:
  - geospatial
  - Python
title: Export a GeoDataFrame to Spatialite
---
I have been doing some geospatial analysis in the last few months, and since I came back from [GeoPython](https://2018.geopython.net/) in Basel (really good conference by the way, definitely recommended) I kept playing around with several Python libraries.

https://twitter.com/jackdbd/status/994548711664570369

One of my favourite talks at the conference was by [John A Stevenson](https://all-geo.org/volcan01010/), a Scottish volcanologist.

Apart from the scans of his amazing field notebooks, beautifully filled with annotations and drawings, I was impressed by his technical expertise and passion for his work.

John mentioned that a common issue for researches that have to showcase their work at conferences is to deal with shapefiles. Instead of having to juggle with many different folders, files, and versions, he suggested to use a portable geospatial database. He mentioned two software solutions: [Geopackage](https://cholmes.wordpress.com/2013/08/20/spatialite-and-geopackage/) and [Spatialite](https://en.wikipedia.org/wiki/SpatiaLite).

Given that I had already [heard about Spatialite](https://www.bostongis.com/PrinterFriendly.aspx?content_name=spatialite_tut01), I decided to try it.

In a [toy project of mine](https://github.com/jackdbd/aree-protette) I used some shapefiles available on the [Open Data portal of Tuscany](https://dati.toscana.it/dataset). I loaded the shapefiles with [GeoPandas](https://geopandas.org/en/stable/), performed some really simple geospatial analysis, and created a few maps with [GeoViews](https://geoviews.org/) and [Cartopy](https://scitools.org.uk/cartopy/docs/latest/index.html). I decided to use Spatialite to export the geometries created by GeoPandas to a SQLite database.

The `GeoPandas`'s `GeoDataFrame` class inherits from `Pandas`'s `DataFrame`, so it has a `to_sql()` method. I thought: _"I just have to call that method and pass the connection URI to my SQLite database, easy peasy!"_.

Well, [turns out](https://github.com/geopandas/geopandas/issues/595) it wasn't actually that easy... so I am writing this post to remember what I did.

## Install Spatialite

Spatialite is actually a geospatial _extension_ of SQLite, namely a set of functions that allow to store geospatial data in a SQLite database.

If you are on a Ubuntu-based distro, you can install Spatialite with:

```shell
sudo apt-get update
sudo apt-get install spatialite-bin
```

## Check your geometries

Check the geometry type of each row in the `GeoDataFrame`. In my case, all geometries were of type `Polygon`. I think that if you have mixed geometry types (e.g. `Polygon` and `MultiPolygon`) you have to use shapely methods (via GeoPandas) to convert them. Or maybe use different columns for different geometries that you want to store in the database.

```python
# gdf is a GeoPandas DataFrame
print(gdf.geometry.type)
>>> Polygon
```

## Create a database table with no geospatial datatypes

Even if you cannot use `gdf.to_sql()` if you have some geospatial data, it's fine if your `GeoDataFrame` **doesn't actually contain geospatial data** (so it's basically just like any other Pandas `DataFrame`).

Connect to your SQLite database and create a new table.

```python
import os
import sqlite3

DB_PATH = os.path.join(os.getcwd(), 'your-database.db')
# Drop all geospatial data
df = gdf.drop(['geometry', 'AREA', 'PERIMETER'], axis=1)
# Create the table and populate it with non-geospatial datatypes
with sqlite3.connect(DB_PATH) as conn:
    df.to_sql('your_table_name', conn, if_exists='replace', index=False)
```

Note: This is like any other "standard" export from a pandas DataFrame into a SQLite database table. There is no Spatialite functionality involved here. Not yet.

## Add a new column to store the geometry

Now that you have your table, you can use the Spatialite extension to add a new table column to store your geometry (i.e. your geospatial data.

You might wonder: _why do I have to add this column now? Couldn't I have added the column when I created the table?_

According to the [Spatialite documentation](https://www.gaia-gis.it/gaia-sins/spatialite-cookbook/html/new-geom.html), you always must _first create the table_, then add the Geometry-column in a _second time and as a separate step_.

Another thing you have to is to load the Spatialite extension and to initialize your spatial metadata.

Let's say that your geometry is a `Polygon`, you want to use [EPSG:3857](https://epsg.io/3857) as a projected coordinate system, and you want to name your column `wkb_geometry` (see next step why this name). This is what you have to do:

```python
with sqlite3.connect(DB_PATH) as conn:
    conn.enable_load_extension(True)
    conn.load_extension("mod_spatialite")
    conn.execute("SELECT InitSpatialMetaData(1);")
    conn.execute(
        """
        SELECT AddGeometryColumn('your_table_name', 'wkb_geometry', 3857, 'POLYGON', 2);
        """
    )
```

So, to recap:

* `InitSpatialMetaData()` and `AddGeometryColumn()` are functions from Spatialite, so you have to load it as a SQLite extension.
* `InitSpatialMetaData()` must be called before attempting to call any other Spatial SQL function.
* You just need to call `InitSpatialMetaData()` once; calling it multiple times is useless but completely harmless.
* First create the table, then add the Geometry-column as a separate step.

## Convert each shapely geometry into a WKB representation

SQLite 3 supports only a few [storage classes (i.e. datatypes)](https://www.sqlite.org/datatype3.html). You need to store your geospatial data as [BLOB](https://en.wikipedia.org/wiki/Binary_large_object).

GeoPandas stores geospatial data as shapely geometries, so you have to convert them somehow. Thanks to [this answer on GIS Stack Exchange](https://gis.stackexchange.com/a/141854/119309) I found that the `shapely.wkb` module provides `dumps()` and `loads()` functions that work almost exactly as their `pickle` and `simplejson` module counterparts. See [here](https://shapely.readthedocs.io/en/stable/manual.html#well-known-formats) for details.

Each geometry in a GeoPandas `GeoDataFrame` is a `GeoSeries`. A `GeoSeries` is basically a shapely geometry with some additional properties. This means that you can convert a geometry into a binary string with something like this:

```python
wkb = swkb.dumps(gdf.geometry.iloc[0]
```

Since the database column is already there (until now it's filled with `NULL`), you have to use a SQL `UPDATE SET` statement.

I wanted to use `executemany` to perform a batch update, but in order to do that I also needed a `WHERE` clause and an identifier to understand which table cell to update.

When you use `executemany` you have to pass a tuple of tuples as a query parameter, so I prepared my data like this:

```python
import shapely.wkb as swkb

records = [
    {'some_id': gdf.some_id.iloc[i], 'wkb': swkb.dumps(gdf.geometry.iloc[i])}
    for i in range(gdf.shape[0])
]
```

As you can see, each shapely geometry has been converted into its own Well Known Binary representation.

```python
print(type(gdf.geometry.iloc[0]))
>>> <class 'shapely.geometry.polygon.Polygon'>
print(type(records[0]['wkb']))
>>> <class 'bytes'>
```

## Populate the column with binary data

One last step before populating the table is to create the tuple of tuples to use as a query parameter (because I'm doing a batch update with `executemany`).

```python
tuples = tuple((d['wkb'], d['some_id']) for d in records)
```

Finally, the batch update query:

```python
with sqlite3.connect(DB_PATH) as conn:
    conn.enable_load_extension(True)
    conn.load_extension("mod_spatialite")
    conn.executemany(
        """
        UPDATE your_table_name
        SET wkb_geometry=GeomFromWKB(?, 3857)
        WHERE your_table_name.some_id = ?
        """, (tuples)
    )
```

## Double check that it worked

There are several ways to double check that the database contains the right geospatial data.

You can perform a simple query:

```python
with sqlite3.connect(DB_PATH) as conn:
    conn.enable_load_extension(True)
    conn.load_extension("mod_spatialite")
    cur = conn.execute(
        """
        SELECT wkb_geometry FROM your_table_name
        """
    )
    results = cur.fetchall()

print(results)
```

or you can use a Spatialite viewer like [Spatialite GUI](https://www.gaia-gis.it/fossil/spatialite_gui/index) and use its _Map Preview_ feature.

https://res.cloudinary.com/jackdbd/image/upload/v1599302022/spatialite-gui_xgzx3z.png

## Reference

[Jupyter notebook](https://github.com/jackdbd/aree-protette/blob/master/aree-protette.ipynb) where I used Spatialite.

## Extra

[Joris Van den Bossche](https://twitter.com/jorisvdbossche) and [Levi John Wolf](https://twitter.com/levijohnwolf) also gave two excellent talks about GeoPandas, PySal, and geospatial analysis. Be sure to check out their tutorials [here](https://github.com/jorisvandenbossche/geopandas-tutorial) and [here](https://github.com/ljwolf/geopython). The best thing is that you can run their notebooks with [binder](https://mybinder.org/) without having to install anything on your machine!
