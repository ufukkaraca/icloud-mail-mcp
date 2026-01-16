import Imap from 'imap';
import {
  simpleParser,
  ParsedMail,
  Attachment as MailparserAttachment,
  AddressObject as MailparserAddressObject,
} from 'mailparser';
import {
  iCloudConfig,
  EmailMessage,
  Attachment,
  SearchOptions,
} from '../types/config.js';

// Type definitions for IMAP
interface ImapBox {
  attribs: string[];
  delimiter: string;
  children?: ImapBoxes;
  parent?: ImapBox;
}

interface ImapBoxes {
  [boxName: string]: ImapBox;
}

interface ImapMessage {
  on(
    event: 'body',
    listener: (stream: NodeJS.ReadableStream, info: object) => void
  ): this;
  on(
    event: 'attributes',
    listener: (attrs: ImapMessageAttributes) => void
  ): this;
  once(event: 'end', listener: () => void): this;
  once(
    event: 'attributes',
    listener: (attrs: ImapMessageAttributes) => void
  ): this;
}

interface ImapMessageAttributes {
  flags?: string[];
  date?: Date;
  struct?: unknown[];
  size?: number;
}

/**
 * READ-ONLY iCloud Mail Client
 * This client only supports read operations via IMAP.
 * No write, modify, or send operations are available.
 */
export class iCloudMailClient {
  private imap: Imap;
  private config: iCloudConfig;

  constructor(config: iCloudConfig) {
    this.config = config;

    // For IMAP, try email name first (e.g., "johnappleseed"), fallback to full email
    const imapUsername = this.extractEmailName(config.email);

    this.imap = new Imap({
      user: imapUsername,
      password: config.appPassword,
      host: config.imapHost || 'imap.mail.me.com',
      port: config.imapPort || 993,
      tls: true,
      tlsOptions: {
        servername: config.imapHost || 'imap.mail.me.com',
        rejectUnauthorized: false, // Allow self-signed certificates if needed
      },
      authTimeout: 30000, // 30 seconds timeout
      connTimeout: 30000,
    });
  }

  private extractEmailName(email: string): string {
    // Extract username part from email (e.g., "john@icloud.com" -> "john")
    const atIndex = email.indexOf('@');
    return atIndex > 0 ? email.substring(0, atIndex) : email;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.imap.once('ready', () => {
        console.error('IMAP connection ready (READ-ONLY mode)');
        resolve();
      });

      this.imap.once('error', (err: Error) => {
        console.error('IMAP connection error:', err);

        // Try with full email if username-only failed
        if (
          err.message.includes('authenticate') ||
          err.message.includes('Invalid credentials')
        ) {
          console.error('Retrying IMAP connection with full email address...');

          // Recreate IMAP with full email
          this.imap = new Imap({
            user: this.config.email, // Use full email instead of username
            password: this.config.appPassword,
            host: this.config.imapHost || 'imap.mail.me.com',
            port: this.config.imapPort || 993,
            tls: true,
            tlsOptions: {
              servername: this.config.imapHost || 'imap.mail.me.com',
              rejectUnauthorized: false,
            },
            authTimeout: 30000,
            connTimeout: 30000,
          });

          // Try connecting again with full email
          this.imap.once('ready', () => {
            console.error('IMAP connection ready (with full email, READ-ONLY mode)');
            resolve();
          });

          this.imap.once('error', (retryErr: Error) => {
            console.error(
              'IMAP connection failed even with full email:',
              retryErr
            );
            reject(
              new Error(
                `IMAP authentication failed. Please check your app-specific password and ensure two-factor authentication is enabled. Details: ${retryErr.message}`
              )
            );
          });

          this.imap.connect();
        } else {
          reject(new Error(`IMAP connection failed: ${err.message}`));
        }
      });

      this.imap.connect();
    });
  }

  async testConnection(): Promise<{ status: string; message: string }> {
    try {
      console.error('Testing IMAP connection...');
      await this.connect();
      console.error('IMAP connection successful, disconnecting...');
      await this.disconnect();

      return {
        status: 'success',
        message:
          'IMAP connection test successful (READ-ONLY mode - SMTP not available)',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error('Connection test failed:', errorMessage);

      // Provide helpful error messages based on common issues
      let helpfulMessage = errorMessage;
      if (
        errorMessage.includes('authenticate') ||
        errorMessage.includes('Invalid credentials')
      ) {
        helpfulMessage +=
          "\\n\\nTroubleshooting:\\n1. Ensure you're using an app-specific password, not your regular Apple ID password\\n2. Verify that two-factor authentication is enabled on your Apple ID\\n3. Generate a new app-specific password if the current one isn't working\\n4. Check that your Apple ID hasn't been locked";
      } else if (
        errorMessage.includes('timeout') ||
        errorMessage.includes('ENOTFOUND') ||
        errorMessage.includes('ECONNREFUSED')
      ) {
        helpfulMessage +=
          '\\n\\nTroubleshooting:\\n1. Check your internet connection\\n2. Verify firewall settings allow connections to iCloud mail servers\\n3. Try connecting from a different network';
      }

      return {
        status: 'error',
        message: helpfulMessage,
      };
    }
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      this.imap.once('end', () => {
        resolve();
      });
      this.imap.end();
    });
  }

  async getMailboxes(): Promise<ImapBoxes> {
    return new Promise((resolve, reject) => {
      this.imap.getBoxes((err: Error, boxes: ImapBoxes) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(boxes);
      });
    });
  }

  async getMessages(
    mailbox: string = 'INBOX',
    limit: number = 10,
    unreadOnly: boolean = false
  ): Promise<EmailMessage[]> {
    return new Promise((resolve, reject) => {
      this.imap.openBox(mailbox, true, (err: Error) => {
        if (err) {
          reject(err);
          return;
        }

        const searchCriteria = unreadOnly ? ['UNSEEN'] : ['ALL'];

        this.imap.search(searchCriteria, (err: Error, results: number[]) => {
          if (err) {
            reject(err);
            return;
          }

          if (!results || results.length === 0) {
            resolve([]);
            return;
          }

          const messageIds = results.slice(-limit);
          const fetch = this.imap.fetch(messageIds, {
            bodies: '',
            struct: true,
          });

          const messages: EmailMessage[] = [];

          fetch.on('message', (msg: ImapMessage, seqno: number) => {
            let emailData = '';

            msg.on('body', (stream: NodeJS.ReadableStream) => {
              stream.on('data', (chunk: Buffer) => {
                emailData += chunk.toString('utf8');
              });

              stream.once('end', async () => {
                try {
                  const parsed: ParsedMail = await simpleParser(emailData);

                  const attachments: Attachment[] = [];
                  if (parsed.attachments) {
                    parsed.attachments.forEach((att: MailparserAttachment) => {
                      attachments.push({
                        filename: att.filename || 'unknown',
                        contentType:
                          att.contentType || 'application/octet-stream',
                        size: att.size || 0,
                        data: att.content,
                      });
                    });
                  }

                  const getEmailText = (
                    addr:
                      | MailparserAddressObject
                      | MailparserAddressObject[]
                      | undefined
                  ) => {
                    if (!addr) return '';
                    if (Array.isArray(addr))
                      return addr.map((a) => a.text).join(', ');
                    return addr.text;
                  };

                  const emailMessage: EmailMessage = {
                    id: parsed.messageId || `${seqno}`,
                    from: getEmailText(parsed.from),
                    to: parsed.to
                      ? Array.isArray(parsed.to)
                        ? parsed.to.map((t) => getEmailText(t))
                        : [getEmailText(parsed.to)]
                      : [],
                    subject: parsed.subject || '',
                    body: parsed.text || parsed.html || '',
                    date: parsed.date || new Date(),
                    flags: [],
                    attachments:
                      attachments.length > 0 ? attachments : undefined,
                  };

                  messages.push(emailMessage);
                } catch (parseError) {
                  console.error('Error parsing email:', parseError);
                }
              });
            });

            msg.once('attributes', (attrs: ImapMessageAttributes) => {
              if (attrs.flags) {
                const lastMessage = messages[messages.length - 1];
                if (lastMessage) {
                  lastMessage.flags = attrs.flags;
                }
              }
            });
          });

          fetch.once('error', (fetchErr: Error) => {
            reject(fetchErr);
          });

          fetch.once('end', () => {
            resolve(messages);
          });
        });
      });
    });
  }

  async searchMessages(options: SearchOptions): Promise<EmailMessage[]> {
    const {
      query,
      mailbox = 'INBOX',
      limit = 10,
      dateFrom,
      dateTo,
      fromEmail,
      unreadOnly = false,
    } = options;

    return new Promise((resolve, reject) => {
      this.imap.openBox(mailbox, true, (err: Error) => {
        if (err) {
          reject(err);
          return;
        }

        type SearchCriterion =
          | string
          | [string, string | Date]
          | [string, [string, string], [string, string]];
        const searchCriteria: SearchCriterion[] = [];

        if (unreadOnly) {
          searchCriteria.push('UNSEEN');
        }

        if (dateFrom) {
          const date = new Date(dateFrom);
          if (!isNaN(date.getTime())) {
            searchCriteria.push(['SINCE', date]);
          }
        }

        if (dateTo) {
          const date = new Date(dateTo);
          if (!isNaN(date.getTime())) {
            searchCriteria.push(['BEFORE', date]);
          }
        }

        if (fromEmail) {
          searchCriteria.push(['FROM', fromEmail]);
        }

        if (query) {
          searchCriteria.push(['OR', ['SUBJECT', query], ['BODY', query]]);
        }

        if (searchCriteria.length === 0) {
          searchCriteria.push('ALL');
        }

        this.imap.search(searchCriteria, (err: Error, results: number[]) => {
          if (err) {
            reject(err);
            return;
          }

          if (!results || results.length === 0) {
            resolve([]);
            return;
          }

          const messageIds = results.slice(-limit);
          const fetch = this.imap.fetch(messageIds, {
            bodies: '',
            struct: true,
          });

          const messages: EmailMessage[] = [];

          fetch.on('message', (msg: ImapMessage, seqno: number) => {
            let emailData = '';

            msg.on('body', (stream: NodeJS.ReadableStream) => {
              stream.on('data', (chunk: Buffer) => {
                emailData += chunk.toString('utf8');
              });

              stream.once('end', async () => {
                try {
                  const parsed: ParsedMail = await simpleParser(emailData);

                  const attachments: Attachment[] = [];
                  if (parsed.attachments) {
                    parsed.attachments.forEach((att: MailparserAttachment) => {
                      attachments.push({
                        filename: att.filename || 'unknown',
                        contentType:
                          att.contentType || 'application/octet-stream',
                        size: att.size || 0,
                        data: att.content,
                      });
                    });
                  }

                  const getEmailText = (
                    addr:
                      | MailparserAddressObject
                      | MailparserAddressObject[]
                      | undefined
                  ) => {
                    if (!addr) return '';
                    if (Array.isArray(addr))
                      return addr.map((a) => a.text).join(', ');
                    return addr.text;
                  };

                  const emailMessage: EmailMessage = {
                    id: parsed.messageId || `${seqno}`,
                    from: getEmailText(parsed.from),
                    to: parsed.to
                      ? Array.isArray(parsed.to)
                        ? parsed.to.map((t) => getEmailText(t))
                        : [getEmailText(parsed.to)]
                      : [],
                    subject: parsed.subject || '',
                    body: parsed.text || parsed.html || '',
                    date: parsed.date || new Date(),
                    flags: [],
                    attachments:
                      attachments.length > 0 ? attachments : undefined,
                  };

                  messages.push(emailMessage);
                } catch (parseError) {
                  console.error('Error parsing email:', parseError);
                }
              });
            });

            msg.once('attributes', (attrs: ImapMessageAttributes) => {
              if (attrs.flags) {
                const lastMessage = messages[messages.length - 1];
                if (lastMessage) {
                  lastMessage.flags = attrs.flags;
                }
              }
            });
          });

          fetch.once('error', (fetchErr: Error) => {
            reject(fetchErr);
          });

          fetch.once('end', () => {
            resolve(messages);
          });
        });
      });
    });
  }

  async downloadAttachment(
    messageId: string,
    attachmentIndex: number = 0,
    mailbox: string = 'INBOX'
  ): Promise<{
    status: string;
    message: string;
    attachment?: {
      filename: string;
      contentType: string;
      size: number;
      data: string;
    };
  }> {
    return new Promise((resolve) => {
      this.imap.openBox(mailbox, true, (err: Error) => {
        if (err) {
          resolve({
            status: 'error',
            message: `Failed to open mailbox '${mailbox}': ${err.message}`,
          });
          return;
        }

        this.imap.search(['ALL'], (err: Error, results: number[]) => {
          if (err) {
            resolve({
              status: 'error',
              message: `Failed to search messages: ${err.message}`,
            });
            return;
          }

          if (!results || results.length === 0) {
            resolve({
              status: 'error',
              message: 'No messages found in mailbox',
            });
            return;
          }

          const fetch = this.imap.fetch(results, {
            bodies: '',
            struct: true,
          });

          let found = false;

          fetch.on('message', (msg: ImapMessage, seqno: number) => {
            if (found) return;

            let emailData = '';

            msg.on('body', (stream: NodeJS.ReadableStream) => {
              stream.on('data', (chunk: Buffer) => {
                emailData += chunk.toString('utf8');
              });

              stream.once('end', async () => {
                try {
                  const parsed: ParsedMail = await simpleParser(emailData);

                  if (
                    parsed.messageId === messageId ||
                    `${seqno}` === messageId
                  ) {
                    found = true;

                    if (
                      !parsed.attachments ||
                      parsed.attachments.length === 0
                    ) {
                      resolve({
                        status: 'error',
                        message: 'No attachments found in the message',
                      });
                      return;
                    }

                    if (attachmentIndex >= parsed.attachments.length) {
                      resolve({
                        status: 'error',
                        message: `Attachment index ${attachmentIndex} out of range. Message has ${parsed.attachments.length} attachments`,
                      });
                      return;
                    }

                    const attachment = parsed.attachments[attachmentIndex];

                    resolve({
                      status: 'success',
                      message: `Successfully downloaded attachment '${attachment.filename}'`,
                      attachment: {
                        filename: attachment.filename || 'unknown',
                        contentType:
                          attachment.contentType || 'application/octet-stream',
                        size: attachment.size || 0,
                        data: attachment.content.toString('base64'),
                      },
                    });
                  }
                } catch (parseError) {
                  console.error('Error parsing email:', parseError);
                }
              });
            });
          });

          fetch.once('error', (fetchErr: Error) => {
            resolve({
              status: 'error',
              message: `Failed to fetch messages: ${fetchErr.message}`,
            });
          });

          fetch.once('end', () => {
            if (!found) {
              resolve({
                status: 'error',
                message: `Message with ID '${messageId}' not found`,
              });
            }
          });
        });
      });
    });
  }
}
