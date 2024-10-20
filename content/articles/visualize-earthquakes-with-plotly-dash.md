---
date: "2017-08-31T22:12:03.284Z"
tags:
  - Dash
  - Python
title: Visualize Earthquakes with Plotly Dash
---
Three years ago I followed a few data science courses offered by the Johns Hopkins University on Coursera. Today these courses should be available among the ones in the [Data Science specialization](https://www.coursera.org/specializations/jhu-data-science#courses). All programming assignments were – and still are – in R. At the end of one course we had to create a small web application with [Shiny](https://shiny.rstudio.com/) and deploy it on [shinyapps](https://www.shinyapps.io/). At the time I wasn't that comfortable in writing Javascript and CSS, so having to worry only about R code was quite a relief. I still have the [web app that I wrote](https://github.com/jackdbd/ShinyEarthquakes).

Some time ago I had the idea of rewriting the entire thing in Python, so I started looking for a Python equivalent of Shiny. I stumbled upon [Spyre](https://github.com/adamhajari/spyre), [Pyxley](https://github.com/stitchfix/pyxley) and [Superset](https://github.com/apache/incubator-superset)). I immediately discarded Superset. It looked amazing, but I wanted something for a very small application, not an enterprise-ready business intelligence tool. Spyre didn't convince me, and I tried but struggled with Pyxley.

I toyed with the idea of writing the application with a combination of Flask for the logic and routing, Vue.js for the front-end, Webpack for asset bundling and maybe a SASS framework (or toolkit, like [Susy](https://www.oddbird.net/susy/)) for styling. I knew I would have to invest a considerable amount of time to put everything together, so I left the project on the side for a while.

A few months passed and I discovered a few more packages: [Bowtie](https://github.com/jwkvam/bowtie), [Bokeh](https://demo.bokehplots.com/), [Dash](https://plot.ly/dash/). I found out that you can also create an [online dashboard with plotly](https://plot.ly/python/create-online-dashboard/).

According to the [documentation](https://plot.ly/dash/introduction), "Dash is simple enough that you can bind a user interface around your Python code in an afternoon". In fact, for a simple dashboard with a dropdown menu as the input, and a time series as the output, you need [less than 50 lines of code](https://medium.com/@plotlygraphs/introducing-dash-5ecf7191b503).

Dash allows you to create _reactive_ web applications. This means that changes to _input_ UI component/s trigger changes to an _output_ UI component.

The UI components are created with D3.js and WebGL, so they look amazing. And you get all of this without having to write any HTML/JS/CSS. Under the hood Dash converts React components (written in JavaScript) into Python classes that are compatible with the Dash ecosystem.

The [getting started](https://plot.ly/dash/getting-started) is top-notch, so I suggest you to start from there if you want to try Dash out. Here I will briefly describe what I did for my app.

https://res.cloudinary.com/jackdbd/image/upload/v1599303705/demo_dudpt8.gif

## Imports

Here are my import statements. `dash_html_components` are pure HTML components, and `dash_core_components` are the reactive components. You need to use _one or more_ `Input` to trigger changes to a _single_ `Output`.

```python
import os
import arrow
import requests
import functools
import pandas as pd
import dash_core_components as dcc
import dash_html_components as html
import plotly.graph_objs as go
import plotly.plotly as py
from flask import Flask, json
from dash import Dash
from dash.dependencies import Input, Output
from dotenv import load_dotenv
```

When the app is running on my computer I enable `debug` and load the environment variables from a `.env` file (not checked in).
When the app is running on [Heroku](https://belle-croissant-54211.herokuapp.com/) I disable `debug` and use an external Javascript snippet to include Google Analytics. I can't remember where I found the `try/except` to understand whether the app is on Heroku or not, but I find it very pythonic.

> [EAFP](https://docs.python.org/3/glossary.html#term-eafp): easier to ask for forgiveness than permission.

```python
try:
    # the app is on Heroku
    os.environ['DYNO']
    debug = False
    # google analytics with my tracking ID
    external_js.append('https://codepen.io/jackdbd/pen/NgmpzR.js')
except KeyError:
    debug = True
    dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
    load_dotenv(dotenv_path)
```

The world map I am displaying requires a [plotly API key](https://plot.ly/settings/api) and a [Mapbox API access token](https://www.mapbox.com/studio/account/tokens/).

```python
py.sign_in(os.environ['PLOTLY_USERNAME'], os.environ['PLOTLY_API_KEY'])
mapbox_access_token = os.environ.get('MAPBOX_ACCESS_TOKEN', 'mapbox-token')
```

Here is how I initialize my Dash app. I create a Flask app first because I want to use a secret key. I don't think you can set a secret key directly when you instantiate the `Dash` class.

```python
app_name = 'Dash Earthquakes'
server = Flask(app_name)
server.secret_key = os.environ.get('SECRET_KEY', 'default-secret-key')
app = Dash(name=app_name, server=server)
```

## Data

I get the latest 4.5+ magnitude earthquakes from the [USGS](https://www.usgs.gov/) website with a basic, synchronous `GET` request.
Next time I will try to make an asynchronous request with [asyncio](https://www.terriblecode.com/blog/asynchronous-http-requests-in-python/) or one of the following libraries: [grequests](https://github.com/kennethreitz/grequests), [asks](https://github.com/theelous3/asks), [curio-http](https://github.com/scribu/curio-http), [requests-futures](https://github.com/ross/requests-futures).

```python
usgs = 'https://earthquake.usgs.gov/earthquakes/'
geoJsonFeed = 'feed/v1.0/summary/4.5_month.geojson'
url = '{}{}'.format(usgs, geoJsonFeed)
req = requests.get(url)
data = json.loads(req.text)
```

Choosing the right colors for a visualization is [surprisingly hard](https://jakevdp.github.io/blog/2014/10/16/how-bad-is-your-colormap/), so I use [ColorBrewer](https://colorbrewer2.org/).

```python
# https://colorbrewer2.org/#type=sequential&scheme=YlOrRd&n=5
colorscale_magnitude = [
    [0, '#ffffb2'],
    [0.25, '#fecc5c'],
    [0.5, '#fd8d3c'],
    [0.75, '#f03b20'],
    [1, '#bd0026'],
]

# https://colorbrewer2.org/#type=sequential&scheme=Greys&n=3
colorscale_depth = [
    [0, '#f0f0f0'],
    [0.5, '#bdbdbd'],
    [0.1, '#636363'],
]
```

Finally, some Dash code. Every Dash app requires a `layout`. The python code you write here will be converted in HTML components. I use a few functions to create portions of the dashboard. This way the layout is a bit cleaner and easier to modify.

```python
app.layout = html.Div(
    children=[
        create_header(app_name),
        html.Div(
            children=[
                html.Div(create_dropdowns(), className='row'),
                html.Div(create_content(), className='row'),
                html.Div(create_description(), className='row'),
                html.Div(create_table(dataframe), className='row'),
            ],
        ),
        # html.Hr(),
        create_footer(),
    ],
    className='container',
    style={'font-family': theme['font-family']}
)
```

Here are a couple of functions that are responsible for a portion of the UI. If you want you can check the complete code on [GitHub](https://github.com/jackdbd/dash-earthquakes).

`create_dropdown` creates two **dash core components**. They have to be dash core components, and not simple HTML elements, because each dropdown is an `Input` for the `Graph` object (also a dash core component).

```python
def create_dropdowns():
    drop1 = dcc.Dropdown(
        options=[
            {'label': 'Light', 'value': 'light'},
            {'label': 'Dark', 'value': 'dark'},
            {'label': 'Satellite', 'value': 'satellite'},
            {
                'label': 'Custom',
                'value': 'mapbox://styles/jackdbd/cj6nva4oi14542rqr3djx1liz'
            }
        ],
        value='dark',
        id='dropdown-map-style',
        className='three columns offset-by-one'
    )
    drop2 = dcc.Dropdown(
        options=[
            {'label': 'World', 'value': 'world'},
            {'label': 'Europe', 'value': 'europe'},
            {'label': 'North America', 'value': 'north_america'},
            {'label': 'South America', 'value': 'south_america'},
            {'label': 'Africa', 'value': 'africa'},
            {'label': 'Asia', 'value': 'asia'},
            {'label': 'Oceania', 'value': 'oceania'},
        ],
        value='world',
        id='dropdown-region',
        className='three columns offset-by-four'
    )
    return [drop1, drop2]
```

`create_content` creates a `DIV` with an empty figure inside and return it. The figure will be updated when `_update_graph` is triggered (see below).

```python
def create_content():
    graph = dcc.Graph(id='graph-geo')
    content = html.Div(graph, id='content')
    return content
```

Now that you have inputs – the two dropdowns – and an output – the Graph – you can define the reactive callback `_update_graph`.

The way an `Input` object and an `Output` object are created is with the dash core component `id` attribute. I really like the way the relationship between inputs and output must be declared. It's very explicit: the `value` attribute of a `Dropdown` component triggers a change in the `figure` attribute of the `Graph` component.

`_update_graph` is rather long because every `Figure` needs a `layout` and some `data`. I have to define a bunch of parameters for the `layout` and two overlaid `Scattermapbox` for the `data`.

I use the underscore in front of this function to suggest that it should not be called. In fact, only changes to the dropdown values should trigger its execution.

```python
@app.callback(
    output=Output('graph-geo', 'figure'),
    inputs=[Input('dropdown-map-style', 'value'),
            Input('dropdown-region', 'value')])
def _update_graph(map_style, region):
    dff = dataframe
    radius_multiplier = {'inner': 1.5, 'outer': 3}

    layout = go.Layout(
        title=metadata['title'],
        autosize=True,
        hovermode='closest',
        height=750,
        font=dict(family=theme['font-family']),
        margin=go.Margin(l=0, r=0, t=45, b=10),
        mapbox=dict(
            accesstoken=mapbox_access_token,
            bearing=0,
            center=dict(
                lat=regions[region]['lat'],
                lon=regions[region]['lon'],
            ),
            pitch=0,
            zoom=regions[region]['zoom'],
            style=map_style,
        ),
    )

    data = go.Data([
        # outer circles represent magnitude
        go.Scattermapbox(
            lat=dff['Latitude'],
            lon=dff['Longitude'],
            mode='markers',
            marker=go.Marker(
                size=dff['Magnitude'] * radius_multiplier['outer'],
                colorscale=colorscale_magnitude,
                color=dff['Magnitude'],
                opacity=1,
            ),
            text=dff['Text'],
            # hoverinfo='text',
            showlegend=False,
        ),
        # inner circles represent depth
        go.Scattermapbox(
            lat=dff['Latitude'],
            lon=dff['Longitude'],
            mode='markers',
            marker=go.Marker(
                size=dff['Magnitude'] * radius_multiplier['inner'],
                colorscale=colorscale_depth,
                color=dff['Depth'],
                opacity=1,
            ),
            # hovering behavior is already handled by outer circles
            hoverinfo='skip',
            showlegend=False
        ),
    ])

    figure = go.Figure(data=data, layout=layout)
    return figure
```

As I said at the beginning, you can create Dash apps without having to write any Javascript or CSS. The problem is that even for a very small app like this one, you will probably want to change the styling, add a small script, or maybe just include Google Analytics.

For example, in this app I have to display roughly 300-500 earthquakes in a table, and I use a jQuery plugin to have a nice-looking table with pagination and search functionality. I also added Font Awesome, some styling from the Dash Team and a Google font.

```python
external_js = [
    # jQuery, DataTables, script to initialize DataTables
    'https://code.jquery.com/jquery-3.2.1.slim.min.js',
    '//cdn.datatables.net/1.10.15/js/jquery.dataTables.min.js',
    # small hack for DataTables
    'https://codepen.io/jackdbd/pen/bROVgV.js',
]

external_css = [
    # dash stylesheet
    'https://codepen.io/chriddyp/pen/bWLwgP.css',
    'https://fonts.googleapis.com/css?family=Raleway',
    '//maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css',
    '//cdn.datatables.net/1.10.15/css/jquery.dataTables.min.css',
]

for js in external_js:
    app.scripts.append_script({'external_url': js})

for css in external_css:
    app.css.append_css({'external_url': css})
```

## Conclusion

I had a lot of fun in creating this app, and I'm sure there are many use-cases where a quick (reactive) web app is useful.
I will keep using Dash for future projects. I also want to [write my own component](https://plot.ly/dash/plugins) to practice React.js a bit.

I'm still a bit skeptic about the idea of creating complex layouts in Python though. Even for a small app like this, the layout seems a bit too cumbersome. Applications with a lot of styling might not be ideal as well.

That being said, if you want to build something relatively simple in a day or two, I think Dash is great!

You can find the code for the entire application [on GitHub](https://github.com/jackdbd/dash-earthquakes)
