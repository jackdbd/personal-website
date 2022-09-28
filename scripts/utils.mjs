import path from 'node:path'
import { isOnCloudBuild, isOnGithub } from '@jackdbd/checks/environment'

export const jsonSecret = (name, env = process.env) => {
  // replaceAll available in Node.js 15 and later
  // https://github.com/nodejs/node/blob/master/doc/changelogs/CHANGELOG_V15.md#v8-86---35415
  const env_var_name = name.replaceAll('-', '_').toUpperCase()

  let json
  if (isOnGithub(env)) {
    // we read a secret from GitHub and expose it as environment variable
    json = env[env_var_name]
  }
  if (isOnCloudBuild(env)) {
    // we read a secret from Secret Manager and expose it as environment variable
    json = env[env_var_name]
  } else {
    const json_path = path.join('secrets', `${name}.json`)
    json = fs.readFileSync(json_path).toString()
  }

  return JSON.parse(json)
}
