# iCloud Mail MCP Server (Read-Only Version)

> 🔒 **This is a READ-ONLY fork** of the [original iCloud Mail MCP Server](https://github.com/minagishl/icloud-mail-mcp) by minagishl.
> 
> All write, modify, send, and delete operations have been removed for enhanced security. This version can only **read and search** emails.

A Model Context Protocol (MCP) server for safely browsing and searching iCloud Mail without any risk of modifying, deleting, or sending emails. Perfect for AI assistants and automation tools where you want read-only email access.

## 📚 Documentation

- **[Quick Start Guide](QUICK-START.md)** - Get up and running in 5 minutes
- **[Deployment Guide](DEPLOYMENT.md)** - Railway, Docker, and cloud deployment options
- **[MCP Client Examples](MCP-CLIENT-EXAMPLES.md)** - Integration examples for various clients
- **[Read-Only Notice](READ-ONLY-NOTICE.md)** - Important security information
- **[Changelog](CHANGELOG.md)** - Version history and changes
- **[Implementation Summary](IMPLEMENTATION-SUMMARY.md)** - Technical details

## 🔐 Security Features

- ✅ **No Email Sending**: SMTP functionality completely removed
- ✅ **No Email Modification**: Cannot mark as read/unread, flag, or change email properties
- ✅ **No Email Deletion**: Cannot delete emails or move them to trash
- ✅ **No Mailbox Management**: Cannot create or delete folders
- ✅ **No Message Moving**: Cannot move emails between folders
- ✅ **IMAP Read-Only**: All mailboxes are opened in read-only mode

## 🚀 What You CAN Do

This read-only server allows you to:

1. **Browse Emails** - View email messages from any mailbox
2. **Search Emails** - Search by sender, subject, date range, keywords
3. **List Mailboxes** - View all available folders/mailboxes
4. **Download Attachments** - Download email attachments (read-only)
5. **Test Connection** - Verify IMAP connectivity
6. **Check Configuration** - Verify environment setup

## ⚡ Quick Start

```bash
# 1. Clone the repository
git clone -b read-only-version https://github.com/ufukkaraca/icloud-mail-mcp.git
cd icloud-mail-mcp

# 2. Install dependencies
pnpm install

# 3. Build the project
pnpm run build

# 4. Test it out
ICLOUD_EMAIL="your-email@icloud.com" \
ICLOUD_APP_PASSWORD="xxxx-xxxx-xxxx-xxxx" \
node dist/index.js
```

**Next:** Configure your MCP client - see [Quick Start Guide](QUICK-START.md)

## 🐳 Docker Quick Start

```bash
# Build the Docker image
docker build -t icloud-mail-mcp-readonly .

# Run with Docker
docker run -i --rm \
  -e ICLOUD_EMAIL="your-email@icloud.com" \
  -e ICLOUD_APP_PASSWORD="xxxx-xxxx-xxxx-xxxx" \
  icloud-mail-mcp-readonly
```

**More:** See [Deployment Guide](DEPLOYMENT.md) for complete Docker instructions

## 📋 Available Tools

| Tool | Description | Read-Only |
|------|-------------|-----------|
| `get_messages` | Retrieve email messages | ✅ |
| `get_mailboxes` | List all folders | ✅ |
| `search_messages` | Search with criteria | ✅ |
| `download_attachment` | Download attachments | ✅ |
| `test_connection` | Test IMAP connection | ✅ |
| `check_config` | Verify configuration | ✅ |

### Detailed Tool Documentation

<details>
<summary><strong>Click to expand full tool documentation</strong></summary>

### 1. `get_messages`
Retrieve email messages from a specified mailbox.

**Parameters:**
- `mailbox` (string, optional): Mailbox name (default: "INBOX")
- `limit` (number, optional): Maximum messages to retrieve (default: 10)
- `unreadOnly` (boolean, optional): Retrieve only unread messages (default: false)

**Example:**
```json
{
  "tool": "get_messages",
  "arguments": {
    "mailbox": "INBOX",
    "limit": 20,
    "unreadOnly": true
  }
}
```

### 2. `get_mailboxes`
List all available mailboxes/folders in your iCloud Mail account.

**Parameters:** None

**Example:**
```json
{
  "tool": "get_mailboxes",
  "arguments": {}
}
```

### 3. `search_messages`
Search for messages using various criteria.

**Parameters:**
- `query` (string, optional): Search text (searches subject, from, body)
- `mailbox` (string, optional): Mailbox to search (default: "INBOX")
- `limit` (number, optional): Maximum results (default: 10)
- `dateFrom` (string, optional): Start date (YYYY-MM-DD format)
- `dateTo` (string, optional): End date (YYYY-MM-DD format)
- `fromEmail` (string, optional): Filter by sender email
- `unreadOnly` (boolean, optional): Search only unread messages (default: false)

**Example:**
```json
{
  "tool": "search_messages",
  "arguments": {
    "query": "meeting",
    "fromEmail": "boss@company.com",
    "dateFrom": "2026-01-01",
    "limit": 50
  }
}
```

### 4. `download_attachment`
Download an attachment from a specific message.

**Parameters:**
- `messageId` (string, required): Message ID containing the attachment
- `attachmentIndex` (number, optional): Index of attachment (0-based, default: 0)
- `mailbox` (string, optional): Mailbox name (default: "INBOX")

**Example:**
```json
{
  "tool": "download_attachment",
  "arguments": {
    "messageId": "<message-id@icloud.com>",
    "attachmentIndex": 0
  }
}
```

### 5. `test_connection`
Test the IMAP server connection.

**Parameters:** None

**Example:**
```json
{
  "tool": "test_connection",
  "arguments": {}
}
```

### 6. `check_config`
Check if environment variables are properly configured.

**Parameters:** None

**Example:**
```json
{
  "tool": "check_config",
  "arguments": {}
}
```

</details>

## 🛠️ Installation & Configuration

### Prerequisites

1. **iCloud Account** with Mail enabled
2. **App-Specific Password** - [Generate here](https://appleid.apple.com) (Sign-In and Security → App-Specific Passwords)
3. **Node.js 18+** or Docker

### Local Installation

See [Quick Start Guide](QUICK-START.md) for detailed instructions.

### Claude Desktop Configuration

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "icloud-mail-readonly": {
      "command": "node",
      "args": ["/absolute/path/to/icloud-mail-mcp/dist/index.js"],
      "env": {
        "ICLOUD_EMAIL": "your-email@icloud.com",
        "ICLOUD_APP_PASSWORD": "xxxx-xxxx-xxxx-xxxx"
      }
    }
  }
}
```

**More clients:** See [MCP Client Examples](MCP-CLIENT-EXAMPLES.md)

## 🚢 Deployment Options

| Platform | Status | Guide |
|----------|--------|-------|
| **Local** | ✅ Recommended | [Quick Start](QUICK-START.md) |
| **Docker** | ✅ Recommended | [Deployment Guide](DEPLOYMENT.md#docker-deployment) |
| **Railway** | ⚠️ Advanced | [Deployment Guide](DEPLOYMENT.md#railway-deployment) |
| **Render** | ⚠️ Advanced | [Deployment Guide](DEPLOYMENT.md#render) |
| **Heroku** | ⚠️ Advanced | [Deployment Guide](DEPLOYMENT.md#heroku) |
| **Fly.io** | ⚠️ Advanced | [Deployment Guide](DEPLOYMENT.md#flyio) |

> **Note:** MCP servers are designed for local stdio communication. Cloud deployment requires additional setup. See [Deployment Guide](DEPLOYMENT.md) for details.

## 🔒 Security Best Practices

1. **Use App-Specific Passwords**: Never use your main iCloud password
2. **Store Credentials Securely**: Use environment variables or secure vaults
3. **Enable 2FA**: Two-factor authentication on your Apple ID
4. **Regular Rotation**: Periodically regenerate app-specific passwords
5. **Monitor Access**: Review Apple ID security logs regularly

**More:** See [Security Considerations](DEPLOYMENT.md#security-considerations) in Deployment Guide

## 📊 What's Different from the Original?

### ❌ Removed (8 Write Tools)
- `send_email`, `mark_as_read`, `create_mailbox`, `delete_mailbox`
- `move_messages`, `delete_messages`, `set_flags`, `auto_organize`

### ✅ Kept (6 Read-Only Tools)
- `get_messages`, `get_mailboxes`, `search_messages`
- `download_attachment`, `test_connection`, `check_config`

### 🔧 Technical Changes
- Removed `nodemailer` (SMTP) dependency
- All IMAP operations in read-only mode
- ~600 lines of code removed
- 40% smaller codebase

**Details:** See [Changelog](CHANGELOG.md) and [Implementation Summary](IMPLEMENTATION-SUMMARY.md)

## 🧪 Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm run dev

# Build the project
pnpm run build

# Run tests
pnpm run test

# Type checking
pnpm run typecheck

# Linting
pnpm run lint
```

## 🐛 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Authentication failed | Use app-specific password, not Apple ID password |
| Connection timeout | Check firewall, verify `imap.mail.me.com:993` access |
| Module not found | Run `pnpm install` and `pnpm run build` |
| MCP client can't connect | Use absolute paths, restart client |

**More:** See [Troubleshooting Guide](DEPLOYMENT.md#troubleshooting) in Deployment Guide

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Credits

This is a read-only fork of the excellent [iCloud Mail MCP Server](https://github.com/minagishl/icloud-mail-mcp) by [minagishl](https://github.com/minagishl).

- **Original Author**: [@minagishl](https://github.com/minagishl)
- **Fork Maintainer**: [@ufukkaraca](https://github.com/ufukkaraca)
- **Original Version**: 1.1.1 (full read-write)
- **Fork Version**: 2.0.0 (read-only)

## 📞 Support & Resources

- **Issues**: [GitHub Issues](https://github.com/ufukkaraca/icloud-mail-mcp/issues)
- **Original Project**: [minagishl/icloud-mail-mcp](https://github.com/minagishl/icloud-mail-mcp)
- **MCP Documentation**: [Model Context Protocol](https://modelcontextprotocol.io)
- **Apple ID Security**: [appleid.apple.com](https://appleid.apple.com)

## ⚠️ Disclaimer

This server provides read-only access to your iCloud Mail. While it cannot modify your emails, always:
- Use strong app-specific passwords
- Monitor access logs
- Revoke unused app-specific passwords
- Keep your Apple ID secure with 2FA

The maintainers are not responsible for any misuse or security issues arising from improper configuration.

---

**Made with 🔒 for secure, read-only email access**

**Version**: 2.0.0 | **Updated**: January 16, 2026
