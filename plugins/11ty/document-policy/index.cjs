const Joi = require('joi')
const makeDebug = require('debug')

const NAMESPACE = `eleventy-plugin-document-policy`

const debug = makeDebug(NAMESPACE)

const defaultOptions = {
  foo: 'bar'
}

const options_schema = Joi.object().keys({
  foo: Joi.string().min(1).default(defaultOptions.foo)
})

const documentPolicy = (eleventyConfig, providedOptions) => {
  debug('providedOptions %O', providedOptions)
}

module.exports = { initArguments: {}, configFunction: documentPolicy }
