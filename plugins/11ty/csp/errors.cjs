const { deprecatedDirectives, PREFIX } = require('./constants.cjs')

const validationErrorOrWarnings = ({ allowDeprecatedDirectives, error }) => {
  const detail = error.details[0]
  const warnings = []

  if (detail.path.length === 2) {
    const directive = detail.path[1]
    //   const value = detail.context.value
    const deprecatedDirective = deprecatedDirectives[directive]
    if (deprecatedDirective) {
      const message = [
        `CSP directive ${directive} is deprecated`,
        `Instead, ${deprecatedDirective.whatToDoInstead}`,
        `Learn more: ${deprecatedDirective.hrefs.join(' ')}`
      ].join('. ')
      if (allowDeprecatedDirectives) {
        warnings.push(`${PREFIX} ${message}`)
        return { warnings }
      } else {
        const tip = `Remove the deprecated directives, or set allowDeprecatedDirectives: true if you want to allow them.`
        return {
          error: new Error(
            `${PREFIX} invalid configuration: ${message}. ${tip}`
          ),
          warnings
        }
      }
    } else {
      // This is an error about a CSP directives, but it's not related to a
      // deprecated directive.
      return {
        error: new Error(`${PREFIX} invalid configuration: ${error.message}`),
        warnings
      }
    }
  } else {
    // This is an error about something else in the plugin configuration.
    if (detail.context && detail.context.message) {
      return {
        error: new Error(
          `${PREFIX} invalid configuration: ${detail.context.message}`
        ),
        warnings
      }
    } else {
      return {
        error: new Error(`${PREFIX} invalid configuration: ${error.message}`),
        warnings
      }
    }
  }
}

module.exports = { validationErrorOrWarnings }
