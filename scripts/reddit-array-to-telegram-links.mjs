const anchor = (d, i) => {
  return `${i + 1}. <a href="${d.url}">${d.title} (by ${d.author})</a>`
}

// This script is used in a GitHub worklow

export const main = async () => {
  if (!process.env.REDDIT_RESULTS_AS_JSON) {
    throw new Error(`environment variable REDDIT_RESULTS_AS_JSON not set`)
  }

  const arr = JSON.parse(process.env.REDDIT_RESULTS_AS_JSON)

  let s = arr.map(anchor).join('\n\n')

  // We need to add a newline character, otherwise the GitHub workflow will fail
  // with this error: "Matching delimiter not found".
  s = s.concat('\n')
  // Send output to stdout, so we can redirect it to GITHUB_ENV in the GitHub
  // action.
  console.log(s)
}

main()
