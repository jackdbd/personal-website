/**
 * 11ty paired shortcodes
 * https://www.11ty.dev/docs/shortcodes/#paired-shortcodes
 */
const markdownIt = require('markdown-it')()

const callout = (content, type = 'warn') => {
  let calloutType = ''
  let emoji = ''
  switch (type) {
    case 'info': {
      calloutType = 'callout--info'
      emoji = 'ℹ️'
      break
    }
    case 'question': {
      calloutType = 'callout--question'
      emoji = '❓'
      break
    }
    case 'tip': {
      calloutType = 'callout--tip'
      emoji = '💡'
      break
    }
    case 'warn': {
      calloutType = 'callout--warn'
      emoji = '⚠️'
      break
    }
    default: {
      throw new Error(`callout type not supported: ${type}`)
    }
  }
  return `<div class="callout ${calloutType}">
  <div class="callout__content">
  ${markdownIt.render(`${emoji} — ${content}`)}
  </div>
  </div>`
}

/**
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td
 */
const table = (content, caption = '', separator = ',') => {
  const lines = content.trim().split('\n')

  const lineToRow = (s) => {
    return s
      .split(separator)
      .map((s) => `<td class="">${s}</td>`)
      .join('')
  }

  const headings = lines[0]
    .split(separator)
    .map((s) => `<th scope="col" class="">${s}</th>`)
    .join('')

  const tds = lines.slice(1).map(lineToRow)
  const trs = tds.map((td) => `<tr class="">${td}</tr>`).join('')

  return `
<div class="table-container">
  <div class="table-scroll">
  <table class="">
    <caption>${caption}</caption>
    <thead class="">
      <tr class="">${headings}</tr>
    </thead>
    <tbody class="">
      ${trs}
    </tbody>
  </table>
  </div>
</div>`
}

module.exports = {
  callout,
  table
}
