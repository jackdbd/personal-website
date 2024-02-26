<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="3.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:atom="http://www.w3.org/2005/Atom">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
      <head>
        <title>Feed | <xsl:value-of select="/atom:feed/atom:title"/></title>
        <link rel="stylesheet" href="/assets/css/color.css" />
        <link rel="stylesheet" href="https://unpkg.com/mvp.css" />
        <link rel="stylesheet" href="/assets/css/layout.css" />
        <link rel="stylesheet" href="/assets/css/feed.css" />
      </head>
      <body>
        <main>
          <h1>
            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" style="vertical-align: text-bottom; width: 1.2em; height: 1.2em;" class="pr-1" id="RSSicon" viewBox="0 0 256 256"><defs><linearGradient x1="0.085" y1="0.085" x2="0.915" y2="0.915" id="RSSg"><stop offset="0.0" stop-color="#E3702D"></stop><stop offset="0.1071" stop-color="#EA7D31"></stop><stop offset="0.3503" stop-color="#F69537"></stop><stop offset="0.5" stop-color="#FB9E3A"></stop><stop offset="0.7016" stop-color="#EA7C31"></stop><stop offset="0.8866" stop-color="#DE642B"></stop><stop offset="1.0" stop-color="#D95B29"></stop></linearGradient></defs><rect width="256" height="256" rx="55" ry="55" x="0" y="0" fill="#CC5D15"></rect><rect width="246" height="246" rx="50" ry="50" x="5" y="5" fill="#F49C52"></rect><rect width="236" height="236" rx="47" ry="47" x="10" y="10" fill="url(#RSSg)"></rect><circle cx="68" cy="189" r="24" fill="#FFF"></circle><path d="M160 213h-34a82 82 0 0 0 -82 -82v-34a116 116 0 0 1 116 116z" fill="#FFF"></path><path d="M184 213A140 140 0 0 0 44 73 V 38a175 175 0 0 1 175 175z" fill="#FFF"></path></svg>
            <span>&#160;</span><xsl:value-of select="/atom:feed/atom:author/atom:name" />'s posts
          </h1>

          <p>This is a Web feed. Visit <a href="https://aboutfeeds.com">About Feeds</a> to learn more and get started. It’s free.</p>

          <hr/>

          <ul class="stack">
            <xsl:for-each select="/atom:feed/atom:entry">
            <li>
              <div class="box">
                <h2>
                  <a>
                    <xsl:attribute name="href">
                      <xsl:value-of select="atom:link/@href"/>
                    </xsl:attribute>
                    <xsl:value-of select="atom:title"/>
                  </a>
                </h2>
                <small>Published: <xsl:value-of select="substring(atom:published, 0, 11)" /></small>
                <!-- <small>Last updated: <xsl:value-of select="substring(atom:updated, 0, 11)" /></small> -->
                <p><xsl:value-of select="atom:summary"/></p>
              </div>
            </li>
            </xsl:for-each>
          </ul>
          
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
