const globbyPromise = import('globby')
// https://adamcoster.com/blog/commonjs-and-esm-importexport-compatibility-examples
const makeDebug = require('debug')
const { PREFIX } = require('./constants.cjs')
const { scriptTagsContents, styleTagsContents } = require('./html-parser.cjs')
const {
  contentHash,
  hashAlgorithmFromCspSourceValues,
  stringReplacer
} = require('./utils.cjs')

const debug = makeDebug('eleventy-plugin-csp/lib')

// interface HashAlgorithmMapConfig {
//   'script-src': string[]
//   'script-src-attr': string[]
//   'script-src-elem': string[]
//   'style-src': string[]
//   'style-src-attr': string[]
//   'style-src-elem': string[]
// }

/**
 * Detect the hash algorithm to use for all CSP source values in a CSP directive.
 * Different directives might use different hash algorithms.
 */
const hashAlgorithmMap = (config) => {
  const m = {
    'script-src': undefined,
    'script-src-attr': undefined,
    'script-src-elem': undefined,
    'style-src': undefined,
    'style-src-attr': undefined,
    'style-src-elem': undefined
  }
  const errors = []

  Object.keys(m).forEach((directive) => {
    const sources = config[directive]
    if (sources) {
      debug(
        `CSP directive ${directive} specifies ${sources.length} CSP source value/s: %o`,
        sources
      )
      const { value, error } = hashAlgorithmFromCspSourceValues(sources)
      if (error) {
        errors.push(error)
      }
      if (value) {
        m[directive] = value
      }
    }
  })

  if (errors.length > 0) {
    const message = [
      `${PREFIX} could not figure out which hash algorithms to use in Content-Security-Policy directives`,
      ...errors.map((err) => err.message)
    ].join('; ')
    throw new Error(message)
  }

  return m
}

// interface UniqueHashesConfig {
// algorithm: 'sha256' | 'sha384' | 'sha512'
// parser: scriptTagsContents | styleTagsContents
//   patterns: string[]
// }

const uniqueHashes = async ({ algorithm, parser, patterns }) => {
  const module = await globbyPromise
  const globby = module.globby

  const paths = await globby(patterns)
  debug(
    `Found ${paths.length} HTML ${
      paths.length === 1 ? 'file' : 'files'
    } matching these glob patterns %O`,
    patterns
  )

  const promises = paths.map(async (filepath) => {
    // contents in a single page
    const contents = await parser(filepath)
    // content hashes in a single page
    return contents.map((content) => contentHash({ algorithm, content }))
  })

  // unflattened, with duplicates
  const hashes = await Promise.all(promises)
  // flattened, without duplicates
  const hashesUnique = [...new Set(...hashes)]

  debug(
    ` ${hashesUnique.length} ${
      hashesUnique.length === 1 ? `hash` : `unique hashes`
    } computed from inlined content (across all pages).`
  )

  return hashesUnique
}

const hashesScriptSrcElem = async ({ algorithm, patterns }) => {
  return await uniqueHashes({
    algorithm,
    parser: scriptTagsContents,
    patterns
  })
}

const hashesStyleSrcElem = async ({ algorithm, patterns }) => {
  return await uniqueHashes({
    algorithm,
    parser: styleTagsContents,
    patterns
  })
}

const cspSourceValues = ({ algorithm, hashes, values }) => {
  const i = values.indexOf(algorithm)
  if (i !== -1) {
    debug(`Found ${algorithm} at index ${i}.`)
    return [...values.slice(0, i), ...values.slice(i + 1), ...hashes]
  } else {
    return values
  }
}

const noHashSpecifiedMessage = (directive) =>
  `CSP directive ${directive}: no hash algorithm specified. No hash will be generated. Return original CSP source values.`

const cspSourceValuesScriptAttr = async ({
  directive,
  directives,
  patterns
}) => {
  const hash_algo = hashAlgorithmMap(directives)
  const algorithm = hash_algo[directive]

  if (!algorithm) {
    debug(noHashSpecifiedMessage(directive))
    return directives[directive]
  }

  throw new Error(
    `${PREFIX} NOT IMPLEMENTED: content hash generation for the ${directive} CSP directive is currently not implemented. Use 'unsafe-hashes' instead.`
  )
}

const cspSourceValuesScriptElem = async ({
  directive,
  directives,
  patterns
}) => {
  const hash_algo = hashAlgorithmMap(directives)
  const algorithm = hash_algo[directive]

  if (!algorithm) {
    debug(
      `CSP directive ${directive}: no has algorithm specified. No hash will be generated. Return original CSP source values.`
    )
    return directives[directive]
  }

  debug(noHashSpecifiedMessage(directive))

  const hashes = await hashesScriptSrcElem({
    algorithm,
    patterns
  })

  debug(`CSP directive ${directive}: allow hashes %O`, hashes)

  return cspSourceValues({
    algorithm,
    hashes,
    values: directives[directive]
  })
}

const cspSourceValuesStyleAttr = async ({
  directive,
  directives,
  patterns
}) => {
  const hash_algo = hashAlgorithmMap(directives)
  const algorithm = hash_algo[directive]

  if (!algorithm) {
    debug(noHashSpecifiedMessage(directive))
    return directives[directive]
  }

  throw new Error(
    `${PREFIX} NOT IMPLEMENTED: content hash generation for the ${directive} CSP directive is currently not implemented. Use 'unsafe-inline' instead.`
  )
}

const cspSourceValuesStyleElem = async ({
  directive,
  directives,
  patterns
}) => {
  const hash_algo = hashAlgorithmMap(directives)
  const algorithm = hash_algo[directive]

  if (!algorithm) {
    debug(noHashSpecifiedMessage(directive))
    return directives[directive]
  }

  debug(
    `CSP directive ${directive}: parse HTML and compute ${algorithm} hashes`
  )

  const hashes = await hashesStyleSrcElem({
    algorithm,
    patterns
  })

  debug(`CSP directive ${directive}: allow hashes %O`, hashes)

  return cspSourceValues({
    algorithm,
    hashes,
    values: directives[directive]
  })
}

const cspDirectives = async ({ directives, patterns }) => {
  const m = { ...directives }

  const [
    script_src,
    script_src_attr,
    script_src_elem,
    style_src,
    style_src_attr,
    style_src_elem
  ] = await Promise.all([
    cspSourceValuesScriptElem({
      directive: 'script-src',
      directives,
      patterns
    }),
    cspSourceValuesScriptAttr({
      directive: 'script-src-attr',
      directives,
      patterns
    }),
    cspSourceValuesScriptElem({
      directive: 'script-src-elem',
      directives,
      patterns
    }),
    cspSourceValuesStyleElem({
      directives,
      directive: 'style-src',
      patterns
    }),
    cspSourceValuesStyleAttr({
      directives,
      directive: 'style-src-attr',
      patterns
    }),
    cspSourceValuesStyleElem({
      directives,
      directive: 'style-src-elem',
      patterns
    })
  ])

  if (script_src) {
    m['script-src'] = script_src
  }

  if (script_src_attr) {
    m['script-src-attr'] = script_src_attr
  }

  if (script_src_elem) {
    m['script-src-elem'] = script_src_elem
  }

  if (style_src) {
    m['style-src'] = style_src
  }

  if (style_src_attr) {
    m['style-src-attr'] = style_src_attr
  }

  if (style_src_elem) {
    m['style-src-elem'] = style_src_elem
  }

  const arr = Object.entries(m).map(([key, value]) => {
    debug(`${key} %o`, value)
    if (value === true) {
      return key
    }
    const strings = value.map(stringReplacer)
    return `${key} ${strings.join(' ')}`
  })
  debug('CSP directives that represent the policy %O', arr)

  return arr
}

module.exports = { cspDirectives }
