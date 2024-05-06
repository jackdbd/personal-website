export const ensureEnvVarsAreSet = (env, keys) => {
  for (const k of keys) {
    const json = env[k]
    if (!json) {
      throw new Error(`environment variable ${k} not set`)
    }
  }
}
