import defDebug from 'debug'

const debug = defDebug('11ty:data:talks')

const talks = [
  {
    title: 'HTTP headers for web security',
    date: '2024-04-15T18:00:00.000Z',
    description:
      'A presentation on the most important HTTP response headers for web security. I gave this talk at pisa.dev.',
    host_id: 'pisa.dev',
    host_href: 'https://pisa.dev/',
    href: 'https://github.com/jackdbd/http-response-headers-for-web-security/',
    language: 'Italian'
  },
  {
    title: 'Cloud Tasks: best practices and lessons learned',
    date: '2023-10-31T12:00:00.000Z',
    description:
      'In this talk I described how Cloud Tasks works, highlighted its differences with Cloud Pub/Sub, and suggested a few guidelines to adopt when creating tasks and monitoring queues. I gave this talk at DevFest GDG Cloud Milano 2023.',
    host_id: 'DevFest GDG Cloud Milano 2023',
    host_href:
      'https://gdg.community.dev/events/details/google-gdg-cloud-milano-presents-devfest-gdg-cloud-milano-2023/',
    href: 'https://github.com/jackdbd/cloud-tasks-devfest-milano-2023-slides',
    language: 'English'
  },
  {
    title: 'Zig: il controllo e la potenza del C, senza spararsi sui piedi',
    date: '2023-10-18T12:18:30.000Z',
    description:
      'An introduction to the Zig programming language, aimed to JavaScript developers. I gave this talk at Bologna JS.',
    host_id: 'Bologna JS',
    host_href: 'https://www.bolognajs.com/',
    href: 'https://github.com/jackdbd/zig-bolognajs',
    language: 'Italian'
  },
  {
    title: 'Vale la pena imparare Zig?',
    date: '2023-04-20T18:30:00.000Z',
    description:
      'An introduction to the Zig programming language and toolchain. I gave this talk at pisa.dev.',
    host_id: 'pisa.dev',
    host_href: 'https://pisa.dev/',
    href: 'https://github.com/jackdbd/zig-tour',
    language: 'Italian'
  },
  {
    title: 'Data visualization con Python: teoria e pratica',
    date: '2020-02-06T18:30:00.000Z',
    description:
      'In this presentation I gave at Python Firenze I talked about the fundamentals of data visualization (visual perception, tidy data, the grammar of graphics) and showed many examples of various type of charts in Altair.',
    host_id: 'Python Firenze',
    host_href: 'https://www.meetup.com/it-IT/python-firenze/',
    href: 'https://github.com/jackdbd/python-firenze-meetup-2020-02-06',
    language: 'Italian'
  },
  {
    title: 'Approaching geovisualization and remote sensing with GeoViews',
    date: '2018-08-05T18:30:00.000Z',
    description:
      'In this conference talk I gave at GeoPython I used a shapefile and a few python libraries to show a simple geospatial analysis of Basel districts.',
    host_id: 'GeoPython 2018',
    host_href: 'http://2018.geopython.net/',
    href: 'https://github.com/jackdbd/geoviews-geopython-2018',
    language: 'English'
  },
  {
    title: 'High Performance Data Analysis with big HDF5 files in Python',
    date: '2017-12-18T18:30:00.000Z',
    description:
      'In this tutorial I gave at PyData Munich I showed how to load the entire NYC Taxi & Limousine Commission dataset into an HDF5 dataset, analyze it with pandas and PyTables, and visualize it using Datashader.',
    host_id: 'PyData Munich',
    host_href: 'https://pydatamunich.github.io/',
    href: 'https://github.com/jackdbd/hdf5-pydata-munich',
    language: 'English'
  }
]

debug(`talks available in each 11ty template %O`, talks)

export default talks
