import { debuglog } from 'node:util'

const debug = debuglog('hn:utils')

export const userSubmissions = async (username) => {
  const api_endpoint = `https://hacker-news.firebaseio.com/v0`

  debug(`fetch /user/${username}`)
  const user_res = await fetch(`${api_endpoint}/user/${username}.json`)
  const user = await user_res.json()

  const info = {
    about: user.about,
    created: new Date(user.created * 1000).toISOString(),
    karma: user.karma,
    submitted_items: user.submitted.length
  }
  debug(`info about ${username}`, info)

  return user.submitted
}

// TODO: implement an async generator function that returns as soon as the
// desired HN item (e.g. story, comment) is fetched.

export const latestItemMatching = async ({ username, title }) => {
  debug(`Search submissions by ${username} titled "${title}"`)

  const submissions = await userSubmissions(username)

  let results = await Promise.allSettled(
    submissions.map(async (item_id) => {
      const url = `${api_endpoint}/item/${item_id}.json?print=pretty`
      const res = await fetch(url)
      const obj = await res.json()
      const date_iso = new Date(obj.time * 1000).toISOString()

      if (obj.title === title) {
        debug(`FOUND item ID ${item_id} posted on ${date_iso}: ${obj.title}`)
        return obj
      } else {
        debug(
          `discard item ID ${item_id} posted on ${date_iso} since it does not match title "${title}"`
        )
        return undefined
      }
    })
  )

  results = results.filter((r) => r.status === 'fulfilled' && r.value)
  if (results.length === 0) {
    throw new Error(
      `No HN item submitted by "${username}" matches title "${title}"`
    )
  } else if (results.length === 1) {
    const { id, text, time, title } = results[0].value
    return {
      date_iso: new Date(time * 1000).toISOString(),
      item_id: id,
      text,
      time,
      title,
      url: `https://news.ycombinator.com/item?id=${id}`,
      username
    }
  } else {
    throw new Error(
      `More than a single match: ${results.length} HN items submitted by "${username}" match title "${title}"`
    )
  }
}

export const latestItemByUsername = async (username) => {
  const api_endpoint = `https://hacker-news.firebaseio.com/v0`

  const submissions = await userSubmissions(username)

  const item_id = Math.max(...submissions)
  debug(`fetch /item/${item_id}`)
  const res = await fetch(`${api_endpoint}/item/${item_id}.json?print=pretty`)
  const item = await res.json()
  return item
}

export const latestStoryByUsername = async (username) => {
  const api_endpoint = `https://hacker-news.firebaseio.com/v0`

  const submissions = await userSubmissions(username)

  let results = await Promise.allSettled(
    submissions.map(async (item_id) => {
      const url = `${api_endpoint}/item/${item_id}.json?print=pretty`
      const res = await fetch(url)
      const obj = await res.json()
      const date_iso = new Date(obj.time * 1000).toISOString()
      if (obj.type === 'story') {
        debug(`FOUND story posted on ${date_iso}: ${obj.title}`)
        return { item_id, text: obj.text, time: obj.time, title: obj.title }
      } else {
        debug(
          `discard item ID ${item_id} posted on ${date_iso} since its type is ${obj.type}`
        )
        return undefined
      }
    })
  )

  results = results.filter((r) => r.status === 'fulfilled' && r.value)

  if (results.length === 0) {
    throw new Error(`No Hacker News story submitted by username ${username}`)
  } else {
    // When there is more than one story, this is the most recent one
    const { id, text, time, title } = results[0].value
    return {
      date_iso: new Date(time * 1000).toISOString(),
      item_id: id,
      text,
      time,
      title,
      url: `https://news.ycombinator.com/item?id=${id}`,
      username
    }
  }
}
