const sendEmail = async ({ api_key, email, message, name }) => {
  const strings = [
    `New contact form submission from <b>${name}</b> (${email})`,
    message
  ]

  throw new Error(`sending email is not supported at the moment`)
}

const sendMessageToTelegramChat = async ({
  chat_id,
  email,
  message,
  name,
  token
}) => {
  const strings = [
    `New contact form submission from <b>${name}</b> (${email})`,
    message
  ]

  const body = {
    chat_id,
    disable_notification: false,
    disable_web_page_preview: true,
    parse_mode: 'HTML',
    text: strings.join('\n')
  }

  return fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-type': `application/json`
    }
  })
}

module.exports = { sendEmail, sendMessageToTelegramChat }
