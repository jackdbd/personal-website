const anchor = (d, i) => {
  return `${i + 1}. <a href="${d.url}">${d.title} (by ${d.author})</a>`
}

// This script is used in a GitHub worklow

const main = async () => {
  if (!process.env.REDDIT_JSON) {
    throw new Error(`environment variable REDDIT_JSON not set`)
  }
  // const args = process.argv.slice(2)
  // console.log('=== args ===', args)
  // console.log('=== process.env ===', process.env)
  const arr = JSON.parse(process.env.REDDIT_JSON)

  // let s = `<b>${arr.length} links</b>`
  // s = s.concat('\n\n')
  // s = s.concat(arr.map(anchor).join('\n\n'))

  let s = arr.map(anchor).join('\n\n')

  // we need to add a newline character, otherwise the GitHub workflow will fail
  // with this error: "Matching delimiter not found"
  s = s.concat('\n')
  // send output to stdout, so we can redirect it to GITHUB_ENV in the GitHub action
  console.log(s)
}

main()
