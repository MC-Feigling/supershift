import nodemailer from 'nodemailer'

export interface SmtpConfig {
  host: string
  port: number
  user: string
  pass: string
  from: string
}

const SMTP_PORT_MAX = 65535

export function readSmtp(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim() ?? ''
  const portRaw = process.env.SMTP_PORT?.trim() ?? ''
  const user = process.env.SMTP_USER?.trim() ?? ''
  const pass = process.env.SMTP_PASS ?? ''
  const from = process.env.SMTP_FROM?.trim() ?? ''
  const port = Number(portRaw)
  if (!host || !portRaw || !Number.isInteger(port) || port < 1 || port > SMTP_PORT_MAX) return null
  if (!user || !pass || !from) return null
  return { host, port, user, pass, from }
}

export async function sendInviteMail(config: SmtpConfig, to: string, link: string): Promise<void> {
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  })

  await transport.sendMail({
    from: config.from,
    to,
    subject: 'Einladung zu einem Schichtplan',
    text: [
      'Jemand teilt einen Schichtplan mit dir. Du kannst ihn nur lesen.',
      '',
      link,
      '',
      'Wenn eine E-Mail eingetragen ist, gilt der Link nur für diese Adresse.',
    ].join('\n'),
  })
}
