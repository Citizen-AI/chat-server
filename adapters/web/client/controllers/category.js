const { topics_in_category } = require('../../../../squidex')
// const { squidex_format } = require('../../../web/df_to_webchat_formatter')


module.exports = context => async (req, res) => {
  const topics = await topics_in_category(req.params.category)
  res.render('category', {
    ...context,
    topics
  })
}