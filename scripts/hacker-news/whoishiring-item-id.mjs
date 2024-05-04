import PrettyError from 'pretty-error'
import {
  latestItemByUsername,
  latestItemMatching,
  latestStoryByUsername,
  userSubmissions
} from './utils.mjs'

const pe = new PrettyError()

latestItemByUsername('whoishiring')
  .then(console.log)
  .catch((err) => {
    console.log(pe.render(err))
  })

// latestStoryByUsername('whoishiring')
//   .then(console.log)
//   .catch((err) => {
//     console.log(pe.render(err))
//   })

// const date = new Date().toLocaleDateString('en-US', {
//   year: 'numeric',
//   month: 'long'
// })

// latestItemMatching({
//   username: 'whoishiring',
//   title: `Ask HN: Freelancer? Seeking freelancer? (${date})`
// })
//   .then(console.log)
//   .catch((err) => {
//     console.log(pe.render(err))
//   })

// userSubmissions('whoishiring')
//   .then(console.log)
//   .catch((err) => {
//     console.log(pe.render(err))
//   })
