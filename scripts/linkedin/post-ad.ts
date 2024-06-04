import fs from 'node:fs'
import path from 'node:path'
import defDebug from 'debug'
import { AuthClient, RestliClient } from 'linkedin-api-client'
import type { IntrospectTokenResponse } from 'linkedin-api-client'
import yargs from 'yargs'
import {
  defRenderTelegramErrorMessage,
  EMOJI,
  jsonSecret,
  sendOutput
} from '../utils.js'

const debug = defDebug('linkedin:post-ad')

interface Argv {
  ad: string
}

const DEFAULT: Argv = {
  ad: 'linkedin-freelancing.txt'
}

const splits = new URL(import.meta.url).pathname.split('/')
const app_id = splits[splits.length - 1]
const app_version = '0.1.0'

const renderTelegramErrorMessage = defRenderTelegramErrorMessage({
  header: `<b>${EMOJI.Robot} Post on LinkedIn</b>`,
  footer: `<i>Sent by ${app_id} (vers. ${app_version})</i>`
})

const renderTelegramMessage = ({
  text,
  url
}: {
  text: string
  url: string
}) => {
  let s = `<b>${EMOJI.Robot} Post on LinkedIn</b>`

  s = `${s}\n\nThe following message was <a href="${url}">posted on LinkedIn</a>.`
  s = `${s}\n\n<pre>${text}</pre>`

  s = `${s}\n\n<i>Message sent by: ${app_id} (vers. ${app_version})</i>`
  // we need to add a newline character, otherwise the GitHub workflow will fail
  // with this error: "Matching delimiter not found"
  return `${s}\n`
}

// https://learn.microsoft.com/en-us/linkedin/marketing/versioning
// https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?view=li-lms-2024-05&viewFallbackFrom=li-lms-2022-06&tabs=http
const POSTS_API_VERSION = '202401'

const postOnLinkedIn = async () => {
  const argv = yargs(process.argv.slice(2))
    .usage('Post ad on LinkedIn.\nUsage: npx tsm scripts/linkedin/$0')
    .option('ad', {
      describe: 'Text to post',
      demandOption: false
    })
    .help('info')
    .default(DEFAULT).argv as Argv

  const {
    access_token: accessToken,
    client_id: clientId,
    client_secret: clientSecret
  } = jsonSecret({
    name: 'LINKEDIN',
    filepath: '/run/secrets/linkedin/trusted_client'
  })

  const filepath = path.join('assets', 'ads', argv.ad)
  debug(`read ad from ${filepath}`)
  const text = fs.readFileSync(filepath).toString()

  // https://github.com/linkedin-developers/linkedin-api-js-client?tab=readme-ov-file#authclient
  const authClient = new AuthClient({
    clientId,
    clientSecret
    //   redirectUrl: 'https://www.linkedin.com/developers/tools/oauth/redirect'
  })
  const token_res = await authClient.introspectAccessToken(accessToken)
  const token_data = (token_res as any).data as IntrospectTokenResponse
  const expires_at = new Date(token_data.expires_at! * 1000).toUTCString()
  debug(`LinkedIn OAuth access token %O`, {
    expires_at,
    scopes: token_data.scope
  })

  const restliClient = new RestliClient()
  //   restliClient.setDebugParams({ enabled: true })

  // https://stackoverflow.com/questions/59249318/how-to-get-linkedin-person-id-for-v2-api
  // https://learn.microsoft.com/en-us/linkedin/shared/api-guide/concepts/urns

  // The /v2/userinfo endpoint is unversioned and requires the openid OAuth scope
  const userinfo_response = await restliClient.get({
    accessToken,
    resourcePath: '/userinfo'
  })

  const author = `urn:li:person:${userinfo_response.data.sub}`

  // The /v2/posts endpoint is versioned and requires the w_member_social OAuth scope
  // https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?view=li-lms-2024-05&tabs=http
  // Text share or create an article
  // https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin
  // https://github.com/linkedin-developers/linkedin-api-js-client/blob/master/examples/create-posts.ts
  debug(
    `about to create post on behalf of author ${author} (${userinfo_response.data.name}) using LinkedIn Posts API version ${POSTS_API_VERSION}`
  )
  const res = await restliClient.create({
    accessToken,
    resourcePath: '/posts',
    entity: {
      author,
      commentary: text,
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: []
      },
      lifecycleState: 'PUBLISHED',
      visibility: 'PUBLIC'
    },
    versionString: POSTS_API_VERSION
  })
  //   const res = { createdEntityId: 'fake-entity-id' }

  // LinkedIn share URNs are different from LinkedIn activity URNs
  // https://stackoverflow.com/questions/51857232/what-is-the-distinction-between-share-and-activity-in-linkedin-v2-api
  // https://learn.microsoft.com/en-us/linkedin/shared/api-guide/concepts/urns
  debug(`LinkedIn share URN: ${res.createdEntityId}`)
  const url = `https://www.linkedin.com/feed/update/${res.createdEntityId}/`
  // https://www.linkedin.com/feed/update/urn:li:activity:7203656242630684672/

  return { text, url }
}

postOnLinkedIn()
  .then(renderTelegramMessage)
  .then(sendOutput)
  .catch((err) => {
    sendOutput(renderTelegramErrorMessage(err))
  })
