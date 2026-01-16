# Changelog - Read-Only Version

All notable changes to the read-only fork are documented in this file.

## [2.0.0] - 2026-01-16

### 🔒 Security - Read-Only Fork Created

This is a major version that removes all write, modify, and send capabilities from the original iCloud Mail MCP server.

### ❌ Removed Features

#### Removed Tools (8)
1. **send_email** - Email sending via SMTP
2. **mark_as_read** - Marking messages as read/unread
3. **create_mailbox** - Creating new mailboxes/folders
4. **delete_mailbox** - Deleting mailboxes/folders
5. **move_messages** - Moving messages between mailboxes
6. **delete_messages** - Deleting messages permanently
7. **set_flags** - Setting/removing email flags
8. **auto_organize** - Auto-organizing emails with rules

#### Removed Dependencies
- **nodemailer** (v7.0.5) - SMTP library no longer needed
- **@types/nodemailer** (v6.4.17) - TypeScript types for nodemailer

#### Removed Client Methods
- `sendEmail()` - Send email via SMTP
- `markAsRead()` - Mark messages as read
- `createMailbox()` - Create mailbox
- `deleteMailbox()` - Delete mailbox
- `moveMessages()` - Move messages
- `deleteMessages()` - Delete messages
- `setFlags()` - Set message flags
- `autoOrganize()` - Auto-organize emails

#### Removed Infrastructure
- SMTP transporter completely removed from `iCloudMailClient`
- All nodemailer imports and configurations
- SMTP connection testing from `testConnection()`

### ✅ Kept Features

#### Read-Only Tools (6)
1. **get_messages** - Retrieve email messages
2. **get_mailboxes** - List all mailboxes
3. **search_messages** - Search emails with criteria
4. **download_attachment** - Download email attachments
5. **test_connection** - Test IMAP connectivity
6. **check_config** - Verify configuration

#### Kept Client Methods
- `connect()` - Connect to IMAP server
- `disconnect()` - Disconnect from IMAP
- `getMailboxes()` - List mailboxes
- `getMessages()` - Retrieve messages
- `searchMessages()` - Search messages
- `downloadAttachment()` - Download attachments
- `testConnection()` - Test IMAP connection (SMTP test removed)

### 🔧 Modified

#### Package Configuration
- **Name**: `icloud-mail-mcp` → `icloud-mail-mcp-readonly`
- **Version**: `1.1.1` → `2.0.0`
- **Description**: Updated to indicate read-only nature
- **Keywords**: Added "read-only", "readonly", "viewer"
- **Author**: Updated to credit original author and fork maintainer
- **Repository URL**: Updated to fork URL

#### Server Configuration
- **Name**: `icloud-mail-mcp` → `icloud-mail-mcp-readonly`
- **Version**: `1.1.1` → `2.0.0`
- **Startup Message**: Now indicates "READ-ONLY" mode
- **Tool Descriptions**: All tools now marked as "(READ-ONLY)"

#### Client Implementation
- All IMAP operations use read-only mode: `openBox(mailbox, true)`
- Removed SMTP transporter initialization
- Updated connection messages to indicate read-only mode
- `testConnection()` now only tests IMAP (removed SMTP test)

#### Documentation
- **README.md**: Complete rewrite for read-only version
- **Security Focus**: Emphasized read-only security benefits
- **Clear Tool List**: Only documents available read-only tools
- **Configuration Guide**: Updated for read-only server
- **Troubleshooting**: Updated for IMAP-only operations

### 🎯 Benefits

1. **Enhanced Security**: No risk of accidental email deletion or modification
2. **Safe AI Integration**: Perfect for AI assistants that need email context
3. **Audit-Friendly**: All operations are read-only and traceable
4. **Simpler Permissions**: Only requires IMAP read access
5. **Smaller Footprint**: Removed SMTP dependencies reduce package size

### 📋 Migration Guide

If you're migrating from the full version:

1. **Remove Write Operations**: Any code using write tools will fail
2. **Update Tool Names**: All tools remain the same, just missing write tools
3. **Update Configuration**: No SMTP configuration needed
4. **Test Thoroughly**: Ensure your use case works with read-only access

### 🔗 References

- **Original Repository**: https://github.com/minagishl/icloud-mail-mcp
- **Read-Only Fork**: https://github.com/ufukkaraca/icloud-mail-mcp
- **Original Version**: 1.1.1
- **Fork Version**: 2.0.0

---

## Original Version History

For the history of the original full-featured version, see:
https://github.com/minagishl/icloud-mail-mcp/commits/main
