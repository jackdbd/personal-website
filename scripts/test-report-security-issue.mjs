import openpgp from 'openpgp'
import { txtSecret } from './utils.mjs'

const reportSecurityIssue = async () => {
  const publicKeyArmored = txtSecret('ASCII-armored-PGP-public-key').trim()
  const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored })

  const text =
    'I found a security issue related one of your JavaScript dependencies'

  const encrypted = await openpgp.encrypt({
    message: await openpgp.createMessage({ text }),
    encryptionKeys: publicKey
    // signingKeys: privateKey // optional
  })

  return encrypted
}

const decrypt = async (encrypted) => {
  const message = await openpgp.readMessage({
    armoredMessage: encrypted
  })

  const privateKeyArmored = txtSecret('ASCII-armored-PGP-private-key').trim()
  const passphrase = txtSecret('PGP-passphrase').trim()

  const privateKey = await openpgp.decryptKey({
    privateKey: await openpgp.readPrivateKey({ armoredKey: privateKeyArmored }),
    passphrase
  })

  const { data: decrypted, signatures } = await openpgp.decrypt({
    message,
    decryptionKeys: privateKey
    // verificationKeys: publicKey, // optional
  })

  return decrypted
}

const main = async () => {
  const encrypted = await reportSecurityIssue()
  console.log(
    'message encrypted by some security researcher (using my PGP public key)'
  )
  console.log(encrypted)

  const decrypted = await decrypt(encrypted)
  console.log('message decrypted by me (using my PGP private key)')
  console.log(decrypted)
}

main()
