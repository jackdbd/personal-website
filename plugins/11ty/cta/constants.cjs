const DEBUG_PREFIX = 'eleventy-plugin-cta'

const ERROR_MESSAGE_PREFIX = {
  invalidConfiguration: '[📢 11ty-plugin-cta] INVALID CONFIGURATION'
}

const DEFAULT_CSS_SELECTORS = ['article']

const DEFAULT_CTA = '<div class="cta"><p>Call to Action</p></div>'

// XPath indexes start a 1, not 0
// const DEFAULT_XPATH_EXPRESSIONS = ['//article[1]']
const DEFAULT_XPATH_EXPRESSIONS = []

const DEFAULT_REGEX = new RegExp('^.*\\/posts\\/.*\\/.*\\.html$')
// const DEFAULT_REGEX = /^.*\/posts\/.*\/.*\.html$/

const DEFAULT = {
  rules: [
    {
      cta: DEFAULT_CTA,
      regex: DEFAULT_REGEX,
      cssSelectors: DEFAULT_CSS_SELECTORS,
      xPathExpressions: DEFAULT_XPATH_EXPRESSIONS
    }
  ],
  transformName: 'cta'
}

module.exports = {
  DEBUG_PREFIX,
  DEFAULT,
  DEFAULT_CSS_SELECTORS,
  DEFAULT_CTA,
  DEFAULT_REGEX,
  DEFAULT_XPATH_EXPRESSIONS,
  ERROR_MESSAGE_PREFIX
}
