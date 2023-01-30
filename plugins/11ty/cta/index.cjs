const makeDebug = require('debug')
const { z } = require('zod')
const { JSDOM } = require('jsdom')
const {
  DEBUG_PREFIX,
  DEFAULT,
  DEFAULT_CTA,
  DEFAULT_CSS_SELECTORS,
  DEFAULT_REGEX,
  DEFAULT_XPATH_EXPRESSIONS,
  ERROR_MESSAGE_PREFIX
} = require('./constants.cjs')
const {
  insertCallToActionMatchingCssSelector,
  insertCallToActionMatchingXPathExpression
} = require('./dom.cjs')

const debug = makeDebug(`${DEBUG_PREFIX}:index`)

const rule_schema = z.object({
  cta: z.string().min(1).default(DEFAULT_CTA),
  regex: z.instanceof(RegExp).default(DEFAULT_REGEX),
  cssSelectors: z.array(z.string()).default(DEFAULT_CSS_SELECTORS),
  xPathExpressions: z.array(z.string()).default(DEFAULT_XPATH_EXPRESSIONS)
})

const schema = z
  .object({
    rules: z.array(rule_schema).min(1).default(DEFAULT.rules),
    transformName: z.string().min(1).default(DEFAULT.transformName)
  })
  .default(DEFAULT)

const isHTML = (outputPath) => {
  return outputPath && outputPath.endsWith('.html')
}

const injectIntoDom = ({ cssSelectors, cta, dom, xPathExpressions }) => {
  const n = xPathExpressions.length + cssSelectors.length
  if (n > 0) {
    debug(`inject ${n} CTA in ${dom.window.document.title}`)
  }

  cssSelectors.forEach((selector) => {
    insertCallToActionMatchingCssSelector({ cta, dom, selector })
  })

  xPathExpressions.forEach((expression) => {
    insertCallToActionMatchingXPathExpression({ cta, dom, expression })
  })
}

const callToAction = (eleventyConfig, providedOptions) => {
  const result = schema.safeParse(providedOptions)

  if (!result.success) {
    throw new Error(
      `${ERROR_MESSAGE_PREFIX.invalidConfiguration}: ${result.error.message}`
    )
  }

  const { rules, transformName } = result.data
  debug(`CTA config %O`, { rules, transformName })

  // https://www.11ty.dev/docs/config/#transforms

  eleventyConfig.addTransform(
    transformName,
    async function ctaTransform(content, outputPath) {
      // Eleventy 2.0+ has full access to Eleventy’s `page` variable
      // const inputPath = this.page.inputPath || this.inputPath
      // const outputPath = this.page.outputPath || this.outputPath || outputPath
      // const url = this.url

      if (!isHTML(outputPath)) {
        debug(`${outputPath} is not HTML. Skip`)
        return content
      }

      const indexes = rules
        .map((m, i) => {
          return m.regex.test(outputPath)
            ? { i, matched: true }
            : { i, matched: false }
        })
        .filter((d) => d.matched)
        .map((d) => d.i)

      if (indexes.length === 0) {
        debug(`${outputPath} does NOT match any regex pattern. Skip`)
        return content
      }

      debug(`${outputPath} matches ${indexes.length} regex pattern/s`)

      const dom = new JSDOM(content)

      indexes.forEach((i) => {
        const { cssSelectors, cta, regex, xPathExpressions } = rules[i]

        injectIntoDom({
          cssSelectors,
          cta,
          dom,
          xPathExpressions
        })
      })

      return dom.serialize()
    }
  )
}

module.exports = { initArguments: {}, configFunction: callToAction }
