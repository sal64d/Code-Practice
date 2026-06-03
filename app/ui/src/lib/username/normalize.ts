const USERNAME_KEY_PATTERN = /^[a-z0-9_-]{1,40}$/

export function normalizeDisplayUsername(raw: string): string {
  return raw.trim()
}

export function normalizeUsernameKey(displayUsername: string): string {
  return displayUsername
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '')
    .slice(0, 40)
}

export function isValidUsernameKey(usernameKey: string): boolean {
  return USERNAME_KEY_PATTERN.test(usernameKey)
}
