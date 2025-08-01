import FormData from 'form-data'
import Mailgun from 'mailgun.js'
import logError from '../utils/logError'
import MailManager, {MailManagerOptions} from './MailManager'

export default class MailManagerMailgun extends MailManager {
  mailgun = new Mailgun(FormData)
  mailgunClient = this.mailgun.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY || ''
  })
  async sendEmail(options: MailManagerOptions) {
    const {subject, body, to, attachments, html, tags} = options
    const toArr = Array.isArray(to) ? to : [to]
    const toStr = toArr.join(',')
    try {
      await this.mailgunClient.messages.create(process.env.MAILGUN_DOMAIN!, {
        to: toStr,
        from: process.env.MAIL_FROM,
        subject,
        html,
        body,
        attachments,
        'o:tag': tags
      })
    } catch (e) {
      const error = e instanceof Error ? e : new Error('Mailgun failed to create message')
      logError(error, {tags: {to: toStr, type: 'Mailgun error'}})
      return false
    }
    return true
  }

  async validateEmail(email: string) {
    try {
      const res = await this.mailgunClient.validate.get(email)
      return ['deliverable', 'catch_all', 'unknown'].includes(res.result)
    } catch (e) {
      const error = e instanceof Error ? e : new Error('Mailgun failed to validate emails')
      logError(error, {tags: {type: 'Mailgun error'}})
      return false
    }
  }
}
