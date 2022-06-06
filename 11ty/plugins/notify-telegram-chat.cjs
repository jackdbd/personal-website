const promise = import('@jackdbd/notifications')

const PREFIX = '[💬 notify telegram chat] '

const notifyTelegramChat = async ({ text, chat_id, token }) => {
  if (!text) {
    throw new Error('text not set')
  }
  if (!chat_id || chat_id === '') {
    throw new Error('chat_id not set')
  }
  if (!token) {
    throw new Error('token not set')
  }

  const { sendTelegramMessage } = await promise

  try {
    const result = await sendTelegramMessage({ chat_id, text, token })
    if (result.delivered) {
      console.log(`${PREFIX}📨 ${result.message}`)
    } else {
      console.log(`${PREFIX}🤷 ${result.message}`)
    }
  } catch (err) {
    console.warn(`${PREFIX}⚠️ ${err.message}`)
  }
}

module.exports = { notifyTelegramChat }
