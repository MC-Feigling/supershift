import { readSmtp } from '../utils/smtp'

export default defineEventHandler(() => {
  return { configured: readSmtp() !== null }
})
