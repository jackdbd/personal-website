import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { isOnCloudBuild, isOnGithub } from '@jackdbd/checks/environment'

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
    const filepath = join('secrets', `${name}.json`)
    json = readFileSync(filepath).toString()
  }

  return JSON.parse(json)
}

export const txtSecret = (name, env = process.env) => {
  const env_var_name = name.replaceAll('-', '_').toUpperCase()

  let txt
  if (isOnGithub(env)) {
    txt = env[env_var_name]
  } else {
    const filepath = join('secrets', `${name}.txt`)
    txt = readFileSync(filepath).toString()
  }
  return txt
}
