---
date: "2021-05-06T17:30:03.284Z"
description: A HAR (Http ARchive) file is important when troubleshooting performance issues because it contains data related to the HTTP transactions that occur between a web browser and a website or web app.
ogp:
  image: https://res.cloudinary.com/jackdbd/image/upload/v1620314435/waterfall_google_compare_hqyhcf.png
  imageAlt: A waterfall chart generated from a HAR file.
tags:
  - HTTP
  - web performance
title: Generate and view HAR files
---
A HAR (Http ARchive) file contains data related to the HTTP transactions that occur between a web browser and a website or web app. Generating and analyzing a HAR file is important when troubleshooting performance issues.

## What's inside a HAR file?

The HAR file format is based on JSON, and the current version of the specification (1.2) can be found [here](https://www.softwareishard.com/blog/har-12-spec/).

Inside a HAR file you can find both coarse data regarding every single page visited—like timings for the [DOMContentLoaded](https://developer.mozilla.org/en-US/docs/Web/API/Window/DOMContentLoaded_event) and [load](https://developer.mozilla.org/en-US/docs/Web/API/Window/load_event) events—and granular data describing every single HTTP request made by the browser.

Every [entry](https://www.softwareishard.com/blog/har-12-spec/#entries) in a HAR file is tied to a [page](https://www.softwareishard.com/blog/har-12-spec/#pages) via a `pageref` field. Thanks to this relationship the browser—or any tool that can process and show HAR files—can reconstruct a **waterfall** of HTTP requests.

Down below you can see how [Chrome DevTools](https://developer.chrome.com/docs/devtools/network/reference/) displays the waterfall chart of the Google homepage. The blue vertical line represents the DOMContentLoaded event, while the red one the Load event.

https://res.cloudinary.com/jackdbd/image/upload/v1620314435/waterfall_google_chrome_bp672m.png

And here you can see the waterfall of the same webpage using [Compare](https://compare.sitespeed.io/). The lavender vertical line represents the load event, while the violet one the startRender event (which is a metric calculated by [visualmetrics](https://github.com/WPO-Foundation/visualmetrics/blob/22d152978ac5a3007603d1dca374011874cbf49f/visualmetrics.py#L542)).

https://res.cloudinary.com/jackdbd/image/upload/v1620314435/waterfall_google_compare_hqyhcf.png

Note how Chrome DevTools and Compare share the same color scheme for the horizontal bars. This is usually the case with HAR file viewers, even if there are some tools that use a different color scheme.

The colors of the horizontal bars represent:

- <strong><span style="color:#aaaaaa">Blocked</span></strong>: the request is blocked for some reason: maybe the browser is fetching higher priority requests, there are no TCP connections available, there are too many TCP connections already open (applies only to HTTP/1.0 and HTTP/1.1). Chrome DevTools refers to this case with the terms *Queueing* and *Stalled*.
- <strong><span style="color:#149588">DNS</span></strong>: the browser is performing a DNS lookup, i.e. translating <em>your-website.com</em> into *your-host-ip-address*. DNS requests are cached, so DNS lookup times may differ in subsequent tests. That's why most tools perform at least three runs before generating a waterfall.
- <strong><span style="color:#FE9726">Connect</span></strong>: the browser is establishing a TCP connection, including TCP handshakes/retries.
- <strong><span style="color:#C140CD">SSL (TLS)</span></strong>: browser and server are negotiating an SSL certificate with the [SSL/TLS handshake](https://howhttps.works/the-handshake/).
- <strong><span style="color:#AFBFC5">Send</span></strong>: the browser is sending the request to the server. If it's a PUT or POST request, then this will also include the time spent uploading any data with that request.
- <strong><span style="color:#1EC659">Wait</span></strong>: the server received the request and it is generating a response, while the browser is waiting for the first byte of a response. Chrome DevTools calls this time *TTFB* (Time To First Byte). Note that [other definitions of TTFB](https://developer.mozilla.org/en-US/docs/Glossary/time_to_first_byte) include the DNS lookup time.
- <strong><span style="color:#1DAAF2">Receive</span></strong>: the browser is receiving the response. Chrome DevTools uses the term *Content Download*.

By looking at these waterfalls we can understand **a lot** about the performance of a web page, but first we need to generate a HAR file. So let's see which tools we can use for that.

## Generate a HAR file

You can use several tools to create a HAR file:

1. a web browser like Chrome or Firefox. This is convenient, but don't forget to warm up the DNS cache by making multiple runs. Also, [HAR files generated by browsers are not perfect](https://www.youtube.com/watch?v=dCThwpglIeE&t=108s&ab_channel=sitespeed.io);
2. a browser automation tool like [Puppeteer](https://github.com/Everettss/puppeteer-har), [Cypress](https://github.com/NeuraLegion/cypress-har-generator) or [Browsertime](https://github.com/sitespeedio/browsertime);
3. a web performance tool like [WebPageTest](https://www.webpagetest.org/) or [sitespeed.io](https://github.com/sitespeedio/sitespeed.io);
4. a library that extracts the HTTP transactions from the Chrome DevTools Protocol, like [chrome-har-capturer](https://leonardofaria.net/2020/11/30/creating-har-files-with-lighthouse/) or [chrome-har](https://github.com/sitespeedio/chrome-har).

I like to use WebPageTest to generate a HAR file because of its many test locations and the many options for device emulation. Replicating the same options in Chrome would mean having to implement [custom profiles](https://developer.chrome.com/docs/devtools/device-mode/) for CPU throttling, network throttling and location.

{% callout "warn" %}You should always create a HAR file in an incognito tab, to avoid having requests made by Chrome extensions show up in your waterfall. I find this quite annoying and easy to forget. That's another reason why I prefer a tool like WebPageTest for this task.{% endcallout %}

## View and analyze a HAR file

You have several options to view a HAR file:

1. a web browser;
2. an online tool like [WebPageTest](https://www.webpagetest.org/), [Compare](https://compare.sitespeed.io/), [HAR Analyzer](https://toolbox.googleapps.com/apps/har_analyzer/)
or [HAR Viewer](https://www.softwareishard.com/blog/har-viewer/);
3. a UI component like [Network-Viewer](https://opensource.saucelabs.com/blog/react_network_viewer/) for React.

I like Compare because it lets me load either one or two HAR files, and it lets me... well.. compare them. But the waterfall chart generated by WebPageTest is by far the one with the most details.

The waterfall chart contains a lot of valuable information, and it's important to have a look both at individual rows and at the overall picture.

When looking at a single row, you may want to focus on the response size (body and headers), Cache-Control directives, cookies, and the TTFB.

When looking at the overall picture you can take note of how many parallel requests there are, how many TCP connections, how many HTTP redirects, and whether there are wide horizontal gaps in the chart. The waterfall generated by WebPageTest is particularly useful here, because it shows the JavaScript execution in pink. So for example a wide horizontal gap in the network activity, with many bursts of pink, indicates a CPU bottleneck: low-end mobile devices might have a hard time processing this particular request.

For a thorough analysis of visual patterns that can be found in a waterfall chart, I recommend the talk [How to read a WebPageTest waterfall chart](https://www.youtube.com/watch?v=THmJwZPGAuQ&ab_channel=LondonWebPerformanceGroup) by Matt Hobbs or the [associated blog post](https://nooshu.github.io/blog/2019/10/02/how-to-read-a-wpt-waterfall-chart/).

## Other tools

HAR files are mostly used to detect performance issues, but they can also be useful when developing and (stress) testing web apps and websites. Here are a couple of tools that make use of HAR files for these use-cases:

- [server-replay](https://github.com/Stuk/server-replay): a proxy server that replays HTTP responses. I have never used it, but it seems to me a better solution that mocking HTTP responses with something like [nock](https://github.com/nock/nock).
- [harhar](https://github.com/acastaner/harhar/wiki): a HTTP benchmark tool. It takes all requests recorded in a HAR file and replays them a thousand fold.
