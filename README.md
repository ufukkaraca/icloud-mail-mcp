# iCloud Mail MCP Server (Read-Only Version)

> 🔒 **This is a READ-ONLY fork** of the [original iCloud Mail MCP Server](https://github.com/minagishl/icloud-mail-mcp) by minagishl.
> 
> All write, modify, send, and delete operations have been removed for enhanced security. This version can only **read and search** emails.

A Model Context Protocol (MCP) server for safely browsing and searching iCloud Mail without any risk of modifying, deleting, or sending emails. Perfect for AI assistants and automation tools where you want read-only email access.

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

## 📋 Available Tools

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

## 🛠️ Installation

### Prerequisites

1. **iCloud Account** with Mail enabled
2. **App-Specific Password** for Mail access:
   - Sign in to [appleid.apple.com](https://appleid.apple.com)
   - Go to "Sign-In and Security" > "App-Specific Passwords"
   - Generate a new password for "Mail"
   - Save this password securely

### Setup

```bash
# Clone this repository
git clone -b read-only-version https://github.com/ufukkaraca/icloud-mail-mcp.git
cd icloud-mail-mcp

# Install dependencies using pnpm (or npm/yarn)
pnpm install

# Build the project
pnpm run build
```

## ⚙️ Configuration

Configure your MCP client (e.g., Claude Desktop, Cline, etc.) to use this server:

### Environment Variables

Add to your MCP server configuration:

```json
{
  "icloud-mail-mcp-readonly": {
    "command": "node",
    "args": ["/path/to/icloud-mail-mcp/dist/index.js"],
    "env": {
      "ICLOUD_EMAIL": "your-email@icloud.com",
      "ICLOUD_APP_PASSWORD": "xxxx-xxxx-xxxx-xxxx"
    }
  }
}
```

### For Claude Desktop

Edit your Claude Desktop config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "icloud-mail-readonly": {
      "command": "node",
      "args": ["/absolute/path/to/icloud-mail-mcp/dist/index.js"],
      "env": {
        "ICLOUD_EMAIL": "your-email@icloud.com",
        "ICLOUD_APP_PASSWORD": "your-app-specific-password"
      }
    }
  }
}
```

## 🔒 Security Best Practices

1. **Use App-Specific Passwords**: Never use your main iCloud password
2. **Store Credentials Securely**: Use environment variables or secure vaults
3. **Regular Password Rotation**: Periodically regenerate app-specific passwords
4. **Monitor Access**: Review Apple ID security logs regularly
5. **Limit Scope**: This server only has IMAP read access - no SMTP or write permissions

## 📊 What's Different from the Original?

This read-only fork has removed:

### ❌ Removed Tools (8)
- `send_email` - Send emails via SMTP
- `mark_as_read` - Mark messages as read
- `create_mailbox` - Create new folders
- `delete_mailbox` - Delete folders
- `move_messages` - Move emails between folders
- `delete_messages` - Delete emails
- `set_flags` - Modify email flags
- `auto_organize` - Auto-organize emails with rules

### ✅ Kept Tools (6)
- `get_messages` - Read emails
- `get_mailboxes` - List folders
- `search_messages` - Search emails
- `download_attachment` - Download attachments
- `test_connection` - Test connectivity
- `check_config` - Check configuration

### 🔧 Code Changes
- Removed `nodemailer` dependency (SMTP library)
- Removed all write operations from `iCloudMailClient` class
- All IMAP operations use read-only mode (`openBox(mailbox, true)`)
- Updated package name to `icloud-mail-mcp-readonly`
- Version bumped to 2.0.0 to indicate major breaking changes

## 🧪 Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm run dev

# Build the project
pnpm run build

# Type checking
pnpm run typecheck

# Run tests
pnpm run test

# Run linting
pnpm run lint
```

## 🐛 Troubleshooting

### Authentication Issues

- ✅ Verify you're using an app-specific password (not your Apple ID password)
- ✅ Ensure two-factor authentication is enabled on your Apple ID
- ✅ Generate a new app-specific password if the current one fails
- ✅ Check that your Apple ID hasn't been locked

### Connection Problems

- ✅ Verify internet connectivity
- ✅ Check firewall allows connections to `imap.mail.me.com:993`
- ✅ Try connecting from a different network
- ✅ Ensure iCloud services are operational

### No Messages Retrieved

- ✅ Verify the mailbox name is correct (case-sensitive)
- ✅ Check if the mailbox actually contains messages
- ✅ Try increasing the `limit` parameter
- ✅ Use `get_mailboxes` to see available mailbox names

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Credits

This is a read-only fork of the excellent [iCloud Mail MCP Server](https://github.com/minagishl/icloud-mail-mcp) by [minagishl](https://github.com/minagishl).

Original server features full read-write capabilities. This fork removes all write operations for security-conscious users who only need read access.

## 📞 Support

- **Original Project**: [minagishl/icloud-mail-mcp](https://github.com/minagishl/icloud-mail-mcp)
- **Read-Only Fork**: [ufukkaraca/icloud-mail-mcp](https://github.com/ufukkaraca/icloud-mail-mcp)
- **Issues**: Please open an issue on the respective GitHub repository

## ⚠️ Disclaimer

This server provides read-only access to your iCloud Mail. While it cannot modify your emails, always:
- Use strong app-specific passwords
- Monitor access logs
- Revoke unused app-specific passwords
- Keep your Apple ID secure with 2FA

The maintainers are not responsible for any misuse or security issues arising from improper configuration.

---

**Made with 🔒 for secure, read-only email access**
