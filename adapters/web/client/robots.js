const { host } = process.env

module.exports = (req, res) => {
  res.type('text/plain')
  res.send(`User-agent: *\nAllow: /\nSitemap: ${host}/sitemap.xml`)
}

// thanks https://stackoverflow.com/a/20265155