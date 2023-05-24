import fs from 'node:fs'
import path from 'node:path'
import { isOnCloudBuild, isOnGithub } from '@jackdbd/checks/environment'

export const STRIPE_CONFIG = {
  // https://stripe.com/docs/api/versioning
  apiVersion: '2022-11-15', // as Stripe.LatestApiVersion,
  maxNetworkRetries: 3, // (default is 0)
  timeout: 10000 // ms (default is 80000)
}

export const jsonSecret = (name, env = process.env) => {
  // replaceAll available in Node.js 15 and later
  // https://github.com/nodejs/node/blob/master/doc/changelogs/CHANGELOG_V15.md#v8-86---35415
  const env_var_name = name.replaceAll('-', '_').toUpperCase()

  let json
  if (isOnGithub(env)) {
    json = env[env_var_name]
  } else if (isOnCloudBuild(env)) {
    json = env[env_var_name]
  } else {
    const filepath = path.join('secrets', `${name}.json`)
    json = fs.readFileSync(filepath).toString()
  }

  return JSON.parse(json)
}

export const txtSecret = (name, env = process.env) => {
  const env_var_name = name.replaceAll('-', '_').toUpperCase()

  let txt
  if (isOnGithub(env)) {
    txt = env[env_var_name]
  } else {
    const filepath = path.join('secrets', `${name}.txt`)
    txt = fs.readFileSync(filepath).toString()
  }
  return txt
}

export const sendOutput = async (text) => {
  if (process.env.GITHUB_SHA) {
    // send output to stdout, so we can redirect it to GITHUB_ENV in the GitHub action
    console.log(text)
  } else {
    const json_string = fs
      .readFileSync(path.join('secrets', 'telegram.json'))
      .toString()

    const { chat_id, token } = JSON.parse(json_string)

    const data = {
      chat_id,
      disable_notification: false,
      disable_web_page_preview: true,
      parse_mode: 'HTML',
      text
    }
    // console.log('body for Telegram sendMessage', data)

    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-type': `application/json`
        }
      }
    )

    console.log(`Response status ${res.status}`)
    const res_body = await res.json()
    console.log(`Response body`, res_body)
  }
}
