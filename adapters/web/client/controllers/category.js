const { topics_in_category } = require('../../../../squidex')


module.exports = context => async (req, res) => {
  const topics = await topics_in_category(req.params.category)
  res.render('category', {
    ...context,
    topics
  })
}