# Quick Start Guide - iCloud Mail MCP (Read-Only)

Get up and running in 5 minutes!

## Prerequisites

✅ iCloud account with Mail enabled  
✅ Node.js 18+ installed  
✅ App-specific password from Apple ID

## Step 1: Get App-Specific Password

1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Navigate to **Security** → **App-Specific Passwords**
3. Click **Generate Password**
4. Label it "MCP Mail Server"
5. Copy the password (format: `xxxx-xxxx-xxxx-xxxx`)

## Step 2: Install the Server

```bash
# Clone the repository
git clone -b read-only-version https://github.com/ufukkaraca/icloud-mail-mcp.git
cd icloud-mail-mcp

# Install dependencies
pnpm install
# or: npm install

# Build the project
pnpm run build
```

## Step 3: Test the Server

```bash
# Test with your credentials
ICLOUD_EMAIL="your-email@icloud.com" \
ICLOUD_APP_PASSWORD="xxxx-xxxx-xxxx-xxxx" \
node dist/index.js
```

**Expected output:**
```
Auto-configured iCloud Mail (READ-ONLY) for your-email@icloud.com
IMAP connection ready (READ-ONLY mode)
iCloud Mail MCP Server (READ-ONLY) running on stdio
```

Press `Ctrl+C` to stop.

## Step 4: Configure Claude Desktop

### macOS

Edit: `~/Library/Application Support/Claude/claude_desktop_config.json`

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

**Important:** Replace `/absolute/path/to/icloud-mail-mcp` with your actual path!

### Windows

Edit: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "icloud-mail-readonly": {
      "command": "node",
      "args": ["C:\\Users\\YourName\\icloud-mail-mcp\\dist\\index.js"],
      "env": {
        "ICLOUD_EMAIL": "your-email@icloud.com",
        "ICLOUD_APP_PASSWORD": "xxxx-xxxx-xxxx-xxxx"
      }
    }
  }
}
```

## Step 5: Restart Claude Desktop

1. Quit Claude Desktop completely
2. Restart Claude Desktop
3. Look for the 🔌 icon indicating MCP servers are connected

## Step 6: Test in Claude

Try these prompts:

- "Check my recent emails"
- "Search for emails from john@example.com"
- "List all my email folders"
- "Show me unread emails from the last week"

## Alternative: Docker Setup

### Quick Docker Test

```bash
# Build the image
docker build -t icloud-mail-mcp-readonly .

# Run it
docker run -i --rm \
  -e ICLOUD_EMAIL="your-email@icloud.com" \
  -e ICLOUD_APP_PASSWORD="xxxx-xxxx-xxxx-xxxx" \
  icloud-mail-mcp-readonly
```

### Claude Desktop with Docker

```json
{
  "mcpServers": {
    "icloud-mail-readonly": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "ICLOUD_EMAIL=your-email@icloud.com",
        "-e", "ICLOUD_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx",
        "icloud-mail-mcp-readonly"
      ]
    }
  }
}
```

## Troubleshooting

### "Authentication Failed"

- ✅ Verify you're using an **app-specific password**, not your Apple ID password
- ✅ Check for typos in email or password
- ✅ Ensure 2FA is enabled on your Apple ID
- ✅ Try generating a new app-specific password

### "Connection Timeout"

- ✅ Check internet connection
- ✅ Verify firewall allows `imap.mail.me.com:993`
- ✅ Check [Apple System Status](https://www.apple.com/support/systemstatus/)

### "Module Not Found"

- ✅ Run `pnpm install` in project directory
- ✅ Ensure you ran `pnpm run build`
- ✅ Verify Node.js 18+ is installed: `node --version`

### Claude Desktop Not Connecting

- ✅ Use **absolute paths** in config (not relative like `./dist/index.js`)
- ✅ Completely quit and restart Claude Desktop
- ✅ Check Claude Desktop logs for errors
- ✅ Test server manually first

## What You Can Do

✅ **Read emails** from any mailbox  
✅ **Search emails** by sender, subject, date, keywords  
✅ **List mailboxes** (folders)  
✅ **Download attachments**  
✅ **View email metadata**  

## What You CANNOT Do

❌ Send emails  
❌ Mark as read/unread  
❌ Delete emails  
❌ Move emails  
❌ Create/delete folders  
❌ Modify email flags  

This is a **read-only** server for your security!

## Next Steps

📖 [Full Documentation](README.md)  
🚀 [Deployment Guide](DEPLOYMENT.md)  
🔒 [Security Notice](READ-ONLY-NOTICE.md)  
📝 [Changelog](CHANGELOG.md)  

## Need Help?

- **Issues**: https://github.com/ufukkaraca/icloud-mail-mcp/issues
- **Original Project**: https://github.com/minagishl/icloud-mail-mcp

---

**Ready in 5 minutes!** 🚀
