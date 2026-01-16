#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { iCloudMailClient } from './lib/icloud-mail-client.js';
import { iCloudConfig } from './types/config.js';

const server = new Server(
  {
    name: 'icloud-mail-mcp-readonly',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

let mailClient: iCloudMailClient | null = null;

// Initialize with environment variables if available
async function initializeFromEnv() {
  if (process.env.ICLOUD_EMAIL && process.env.ICLOUD_APP_PASSWORD) {
    const config: iCloudConfig = {
      email: process.env.ICLOUD_EMAIL,
      appPassword: process.env.ICLOUD_APP_PASSWORD,
      imapHost: 'imap.mail.me.com',
      imapPort: 993,
      smtpHost: 'smtp.mail.me.com', // Not used in read-only version
      smtpPort: 587, // Not used in read-only version
    };

    try {
      mailClient = new iCloudMailClient(config);
      await mailClient.connect();
      console.error(`Auto-configured iCloud Mail (READ-ONLY) for ${config.email}`);
    } catch (error) {
      console.error('Failed to auto-configure iCloud Mail:', error);
      mailClient = null;
    }
  }
}

// Initialize on startup
initializeFromEnv();

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_messages',
        description: 'Get email messages from specified mailbox (READ-ONLY)',
        inputSchema: {
          type: 'object',
          properties: {
            mailbox: {
              type: 'string',
              description: 'Mailbox name (default: INBOX)',
              default: 'INBOX',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of messages to retrieve',
              default: 10,
            },
            unreadOnly: {
              type: 'boolean',
              description: 'Retrieve only unread messages',
              default: false,
            },
          },
        },
      },
      {
        name: 'get_mailboxes',
        description: 'List all available mailboxes (READ-ONLY)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'search_messages',
        description: 'Search for messages using various criteria (READ-ONLY)',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description:
                'Search query text (searches in subject, from, body)',
            },
            mailbox: {
              type: 'string',
              description: 'Mailbox name (default: INBOX)',
              default: 'INBOX',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of messages to retrieve',
              default: 10,
            },
            dateFrom: {
              type: 'string',
              description: 'Start date for search (YYYY-MM-DD format)',
            },
            dateTo: {
              type: 'string',
              description: 'End date for search (YYYY-MM-DD format)',
            },
            fromEmail: {
              type: 'string',
              description: 'Filter by sender email address',
            },
            unreadOnly: {
              type: 'boolean',
              description: 'Search only unread messages',
              default: false,
            },
          },
        },
      },
      {
        name: 'download_attachment',
        description: 'Download an attachment from a specific message (READ-ONLY)',
        inputSchema: {
          type: 'object',
          properties: {
            messageId: {
              type: 'string',
              description: 'Message ID containing the attachment',
            },
            attachmentIndex: {
              type: 'number',
              description: 'Index of the attachment to download (0-based)',
              default: 0,
            },
            mailbox: {
              type: 'string',
              description: 'Mailbox name (default: INBOX)',
              default: 'INBOX',
            },
          },
          required: ['messageId'],
        },
      },
      {
        name: 'test_connection',
        description: 'Test the IMAP server connection (READ-ONLY)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'check_config',
        description: 'Check if environment variables are properly configured (READ-ONLY)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_messages': {
        if (!mailClient) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            'iCloud Mail not configured. Please set ICLOUD_EMAIL and ICLOUD_APP_PASSWORD environment variables.'
          );
        }

        const mailbox = (args?.mailbox as string) || 'INBOX';
        const limit = (args?.limit as number) || 10;
        const unreadOnly = (args?.unreadOnly as boolean) || false;

        const messages = await mailClient.getMessages(
          mailbox,
          limit,
          unreadOnly
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(messages, null, 2),
            },
          ],
        };
      }

      case 'get_mailboxes': {
        if (!mailClient) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            'iCloud Mail not configured. Please set ICLOUD_EMAIL and ICLOUD_APP_PASSWORD environment variables.'
          );
        }

        const mailboxes = await mailClient.getMailboxes();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(mailboxes, null, 2),
            },
          ],
        };
      }

      case 'search_messages': {
        if (!mailClient) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            'iCloud Mail not configured. Please set ICLOUD_EMAIL and ICLOUD_APP_PASSWORD environment variables.'
          );
        }

        const query = args?.query as string;
        const mailbox = (args?.mailbox as string) || 'INBOX';
        const limit = (args?.limit as number) || 10;
        const dateFrom = args?.dateFrom as string;
        const dateTo = args?.dateTo as string;
        const fromEmail = args?.fromEmail as string;
        const unreadOnly = (args?.unreadOnly as boolean) || false;

        const messages = await mailClient.searchMessages({
          query,
          mailbox,
          limit,
          dateFrom,
          dateTo,
          fromEmail,
          unreadOnly,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(messages, null, 2),
            },
          ],
        };
      }

      case 'download_attachment': {
        if (!mailClient) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            'iCloud Mail not configured. Please set ICLOUD_EMAIL and ICLOUD_APP_PASSWORD environment variables.'
          );
        }

        const messageId = args?.messageId as string;
        const attachmentIndex = (args?.attachmentIndex as number) || 0;
        const mailbox = (args?.mailbox as string) || 'INBOX';

        const result = await mailClient.downloadAttachment(
          messageId,
          attachmentIndex,
          mailbox
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'test_connection': {
        if (!mailClient) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            'iCloud Mail not configured. Please set ICLOUD_EMAIL and ICLOUD_APP_PASSWORD environment variables.'
          );
        }

        const result = await mailClient.testConnection();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'check_config': {
        const maskCredential = (value: string | undefined) => {
          if (!value) return 'Not set';
          if (value.length <= 4) return '***';
          return value.substring(0, 4) + '***';
        };

        const config = {
          mode: 'READ-ONLY',
          email: {
            value: maskCredential(process.env.ICLOUD_EMAIL),
            configured: !!process.env.ICLOUD_EMAIL,
          },
          appPassword: {
            value: maskCredential(process.env.ICLOUD_APP_PASSWORD),
            configured: !!process.env.ICLOUD_APP_PASSWORD,
          },
          connectionStatus: mailClient ? 'Connected' : 'Not connected',
          note: 'This is a read-only server. No write operations are available.',
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(config, null, 2),
            },
          ],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(
      ErrorCode.InternalError,
      `Error executing tool ${name}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('iCloud Mail MCP Server (READ-ONLY) running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
