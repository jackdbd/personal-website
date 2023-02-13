const makeDebug = require('debug')
const { DEBUG_PREFIX } = require('./constants.cjs')

const debug = makeDebug(`${DEBUG_PREFIX}:dom`)

const insertCallToActionMatchingCssSelector = ({ cta, dom, selector }) => {
  const doc = dom.window.document
  const elements = doc.querySelectorAll(selector)

  if (elements.length === 0) {
    const message = `found no matches for the CSS selector ${selector} on page ${doc.title}. No CTA will be injected in page ${doc.title}`
    debug(message)
  }

  const position = 'afterend'

  elements.forEach((el, i) => {
    const innerHTML = cta
    debug(`inject CTA ${position} CSS selector ${selector} match ${i}`)
    el.insertAdjacentHTML(position, innerHTML)
  })
}

const insertCallToActionMatchingXPathExpression = ({
  cta,
  dom,
  expression
}) => {
  const doc = dom.window.document
  const contextNode = doc
  const resolver = null
  const xPathResultType = dom.window.XPathResult.ANY_TYPE

  debug(`evalutate XPath expression ${expression} on page ${doc.title}`)
  const xPathResult = doc.evaluate(
    expression,
    contextNode,
    resolver,
    xPathResultType,
    null
  )

  const node = xPathResult.iterateNext()

  if (node) {
    const div = doc.createElement('div')
    div.innerHTML = cta

    if (node.parentNode) {
      if (node.nextSibling) {
        const message = `node that matches XPath expression ${expression} on page ${doc.title} has both a parent and a sibling`
        debug(message)
        node.parentNode.insertBefore(div, node.nextSibling)
      } else {
        const message = `node that matches XPath expression ${expression} on page ${doc.title} has a parent but no sibling`
        debug(message)
        node.parentNode.appendChild(div)
      }
    } else {
      const message = `node that matches XPath expression ${expression} on page ${doc.title} has no parent`
      debug(message)
      // maybe try inserting using previousSibling?
    }
  }
}

module.exports = {
  insertCallToActionMatchingCssSelector,
  insertCallToActionMatchingXPathExpression
}
