const { debuglog } = require('node:util')

const debug = debuglog('github-workflow')

const main = async () => {
  let date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long'
  })
  const args = process.argv.slice(2)
  if (args.length > 0) {
    date = args[0]
  }

  const username = 'whoishiring'
  const url = `https://hacker-news.firebaseio.com/v0/user/${username}.json`

  const res = await fetch(url)
  const obj = await res.json()
  const item_ids = obj.submitted

  const title = `Ask HN: Freelancer? Seeking freelancer? (${date})`
  // console.log(`Search submissions by ${username} titled "${title}"`)

  let results = await Promise.allSettled(
    item_ids.map(async (item_id) => {
      const url = `https://hacker-news.firebaseio.com/v0/item/${item_id}.json?print=pretty`
      const res = await fetch(url)
      const obj = await res.json()
      debug(`HN item ID ${item_id} %O`, obj)
      if (obj.title === title) {
        return { item_id, title: obj.title, text: obj.text }
      } else {
        return undefined
      }
    })
  )

  results = results.filter((r) => r.status === 'fulfilled' && r.value)
  if (results.length === 0) {
    throw new Error(
      `No matches: no HN item submitted by "${username}" matches title "${title}"`
    )
  } else if (results.length === 1) {
    const d = results[0].value
    return { item_id: d.item_id, date, title, username }
  } else {
    throw new Error(
      `More than a single match: ${matches.length} HN items submitted by "${username}" match title "${title}"`
    )
  }
}

main().then(console.log)
