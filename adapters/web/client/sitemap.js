const expressSitemapXml = require('express-sitemap-xml')

const { display_topics } = require('../../../squidex')


const { host } = process.env


const sitemap_urls = () => display_topics
  .then(_display_topics => _display_topics
    .map(({ link, lastModified }) => ({
      url: '/answers/' + link,
      lastMod: lastModified,
      changeFreq: 'monthly'
    }))
  )

module.exports = expressSitemapXml(sitemap_urls, host)
