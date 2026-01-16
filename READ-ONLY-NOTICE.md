# 🔒 READ-ONLY VERSION NOTICE

## Important Information

This is a **READ-ONLY** fork of the iCloud Mail MCP Server. It has been specifically modified to remove all write, modify, and send capabilities for enhanced security.

## What This Means

### ✅ You CAN:
- Read email messages from any mailbox
- Search emails by various criteria (sender, subject, date, keywords)
- List all available mailboxes/folders
- Download email attachments
- View email metadata (flags, dates, recipients)
- Test IMAP connectivity

### ❌ You CANNOT:
- Send emails (no SMTP)
- Mark emails as read or unread
- Create new mailboxes/folders
- Delete mailboxes/folders
- Move emails between mailboxes
- Delete emails
- Modify email flags (flagged, starred, etc.)
- Organize emails automatically

## Why Use the Read-Only Version?

### Security Benefits
1. **Zero Risk of Accidental Deletion**: Your emails are completely safe
2. **No Unauthorized Sending**: Cannot send emails on your behalf
3. **Audit-Friendly**: All operations are guaranteed read-only
4. **Safe for AI Assistants**: Perfect for giving AI tools email context without risk
5. **Minimal Permissions**: Only requires IMAP read access

### Use Cases
- **AI Email Analysis**: Let AI assistants read and analyze emails safely
- **Email Backup/Archive**: Read emails for backup purposes
- **Email Search Tools**: Build search interfaces without modification risk
- **Monitoring**: Monitor inbox without touching emails
- **Research/Analytics**: Analyze email patterns and trends
- **Compliance**: Read-only access for audit purposes

## Technical Implementation

### What Was Removed
1. **SMTP Client**: All nodemailer code and dependencies removed
2. **Write Methods**: 8 methods removed from iCloudMailClient class
3. **Write Tools**: 8 MCP tools removed from the server
4. **Dependencies**: nodemailer package removed

### How It's Enforced
1. **IMAP Read-Only Mode**: All mailboxes opened with `readOnly: true`
2. **No SMTP Connection**: SMTP transporter completely removed
3. **Method Removal**: Write methods don't exist in the codebase
4. **Tool Removal**: Write tools not registered with MCP server

## Verification

You can verify this is the read-only version by:

1. **Check Package Name**: `icloud-mail-mcp-readonly` (not `icloud-mail-mcp`)
2. **Check Version**: 2.0.0 or higher
3. **Check Tools**: Run `check_config` tool - it will show "mode": "READ-ONLY"
4. **Check Startup**: Console shows "iCloud Mail MCP Server (READ-ONLY)"
5. **Check Dependencies**: No `nodemailer` in package.json
6. **Check Code**: No `sendEmail`, `markAsRead`, etc. methods in client

## If You Need Write Access

If you need full email management capabilities (send, delete, modify), use the original version:

**Original Full-Featured Version**: https://github.com/minagishl/icloud-mail-mcp

## Security Recommendations

Even with read-only access:

1. ✅ Use app-specific passwords (never your main Apple ID password)
2. ✅ Enable two-factor authentication on your Apple ID
3. ✅ Regularly review active app-specific passwords
4. ✅ Revoke unused passwords immediately
5. ✅ Monitor your Apple ID security logs
6. ✅ Use environment variables for credentials (never hardcode)
7. ✅ Keep your credentials secure and never commit them to version control

## Questions?

If you have questions about:
- **Read-Only Fork**: https://github.com/ufukkaraca/icloud-mail-mcp/issues
- **Original Version**: https://github.com/minagishl/icloud-mail-mcp/issues

---

**Last Updated**: January 16, 2026  
**Fork Maintainer**: Ufuk Karaca ([@ufukkaraca](https://github.com/ufukkaraca))  
**Original Author**: minagishl ([@minagishl](https://github.com/minagishl))
