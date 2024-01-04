/**
 * 11ty paired shortcodes
 * https://www.11ty.dev/docs/shortcodes/#paired-shortcodes
 */
import MarkdownIt from 'markdown-it'

// https://github.com/markdown-it/markdown-it?tab=readme-ov-file#init-with-presets-and-options
const md = MarkdownIt()

export const callout = (content, type = 'warn') => {
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
  ${md.render(`${emoji} — ${content}`)}
  </div>
  </div>`
}

/**
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td
 * TODO: use <table-saw> web component
 * https://www.zachleat.com/web/table-saw/
 */
export const table = (content, caption = '', separator = ',') => {
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
