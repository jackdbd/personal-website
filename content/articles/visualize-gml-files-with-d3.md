---
date: "2017-01-12"
tags:
  - D3.js
  - GML
  - NetworkX
  - Python
title: Visualize GML files with D3
---

I have recently switched from D3 v3.0 to D3 v4.0, and I have already encountered some important changes. For example, the scaling functions are quite different, and the [old layouts available in the older API](https://github.com/d3/d3-3.x-api-reference/blob/master/Layouts.md) have been moved and renamed. In fact, D3 v4.0 is no longer a single library, but many small libraries (about 30) that are designed to work together.

For a weekend project I wanted to create a visualization of a simple graph with nodes and edges. In D3 v3.0 this can be done with `d3.layout.force`. In D3 v4.0 this is a job for `d3.forceSimulation`.

## Looking for some data

I started looking for JSON files that contained the necessary information to represent a small social network graph. To my surprise, I didn't find any. Instead, I found some small network data sets as GML files [here](https://networkdata.ics.uci.edu/index.php) and [here](https://www-personal.umich.edu/~mejn/netdata/). I had never heard of the GML file format before, but since I liked these data sets I decided to proceed. At the end of the article you can see a visualization of a small social network of dolphins (62 nodes, 159 edges). The original file (`dolphins.gml`) was found on [this page](https://networkdata.ics.uci.edu/data.php?id=6) of the University of California Irvine.

## GML (Graph Modelling Language)

The [Graph Modelling Language](https://networkx.github.io/documentation/networkx-1.10/reference/readwrite.gml.html), not to be confused with the [Geography Markup Language](https://en.wikipedia.org/wiki/Geography_Markup_Language), is a portable file format for graphs.

A GML file looks like this:

```shell
# dolphins.gml
Creator "Mark Newman on Wed Jul 26 15:04:20 2006"
graph
[
  directed 0
  node
  [
    id 0
    label "Beak"
  ]
  node
  [
    id 1
    label "Beescratch"
  ]
  # more nodes here...
  edge
  [
    source 8
    target 3
  ]
  edge
  [
    source 9
    target 5
  ]
  # more edges here...
]
```

It doesn't look to different from a JSON file, but the problem is that D3 cannot load it directly. After a brief Google search I found out that I could use a Python library to load the GML file and convert it into JSON.

## NetworkX

[NetworkX](https://networkx.readthedocs.io/en/networkx-1.11/index.html) is a Python package for the creation, manipulation, and study of the structure, dynamics, and functions of complex networks. It's distributed with a BSD license and was developed by Aric Hagberg, Dan Schulz and Pieter Swart.

In NetworkX one can create graphs for undirected and directed networks, add and remove nodes and edges in different ways, visualize the network and export network data to draw it with an external tool.

In order to visualize the network data you can use the `networkx.draw` function and save the image as a PNG with `matplotlib`.

```python
import networkx as nx
import matplotlib.pylab as plt

g = nx.read_gml('dolphins.gml')
nx.draw(g)
plt.savefig('dolphins.png')
```

Apparently there must be some randomness when the figure gets generated, because I ran the code twice and I got 2 different PNG images.

Here is the first one:

https://res.cloudinary.com/jackdbd/image/upload/v1599303249/dolphins_1_i4rute.png

and the second one:

https://res.cloudinary.com/jackdbd/image/upload/v1599303249/dolphins_2_osadpo.png

The network data can also be exported and visualized in a program like GraphViz or Gephi, or, like I will do here, in D3.

I didn't play with NetworkX too much, but from what I've seen [the documentation is great](https://networkx.readthedocs.io/en/networkx-1.11/tutorial/). There is also a nice presentation [here](https://www.cl.cam.ac.uk/~cm542/teaching/2010/stna-pdfs/stna-lecture8.pdf).

Here is the snippet of code to convert a GML file into a JSON file:

```python
import networkx as nx
import simplejson as json
from networkx.readwrite import json_graph

# parse the gml file and build the graph object
g = nx.read_gml('dolphins.gml')
# create a dictionary in a node-link format that is suitable for JSON serialization
d = json_graph.node_link_data(g)
with open('dolphins.json', 'w') as fp:
    json.dump(d, fp)
```

Note that the GML file I used with the latest NetworkX version (1.11) caused the Exception `networkx.exception.NetworkXError: cannot tokenize u'graph' at (2, 1)`. I downgraded NetworkX to version 1.9.1 as suggests in [this thread](https://www.bountysource.com/issues/27097685-problem-reading-gml-file) and it worked fine. Another approach would have been to [format the GML file in a different way](https://stackoverflow.com/questions/32895291/unexpected-error-reading-gml-graph/37819717#37819717).

## The D3 visualization

Finally, with the network data available as `dolphins.json`, we can use `d3.json` to read it. Drag a node or hover on it to know the name of the dolphins in this network!

<figure class="dolphins-graph"></figure>

## References

The file `dolphins.gml` contains an undirected social network of frequent associations between 62 dolphins in a community living off Doubtful Sound,
New Zealand, as compiled by Lusseau et al. (2003).

_D. Lusseau, K. Schneider, O. J. Boisseau, P. Haase, E. Slooten, and S. M. Dawson, The bottlenose dolphin community of Doubtful Sound features a large proportion of long-lasting associations, Behavioral Ecology and Sociobiology 54, 396-405 (2003)._

Additional information on the network can be found in:

* _D. Lusseau, The emergent properties of a dolphin social network, Proc. R. Soc. London B (suppl.) 270, S186-S188 (2003)._

* _D. Lusseau, [Evidence for social role in a dolphin social network](https://arxiv.org/abs/q-bio.PE/0607048), Preprint q-bio/0607048_
