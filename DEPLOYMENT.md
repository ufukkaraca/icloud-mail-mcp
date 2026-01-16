# Deployment Guide - iCloud Mail MCP Server (Read-Only)

This guide covers deploying the read-only iCloud Mail MCP server to various platforms.

> ⚠️ **Important**: This MCP server is designed to run as a **local process** that communicates via stdio with MCP clients (like Claude Desktop). Most cloud platforms are designed for HTTP servers, not stdio-based processes. 
>
> The recommended approach is **local deployment** or using **Docker locally**. Cloud deployment is possible but requires additional setup for remote MCP access.

---

## Table of Contents

1. [Local Deployment (Recommended)](#local-deployment-recommended)
2. [Docker Deployment](#docker-deployment)
3. [Railway Deployment](#railway-deployment)
4. [Alternative Cloud Platforms](#alternative-cloud-platforms)
5. [Environment Variables](#environment-variables)
6. [MCP Client Integration](#mcp-client-integration)
7. [Testing Your Deployment](#testing-your-deployment)
8. [Security Considerations](#security-considerations)
9. [Troubleshooting](#troubleshooting)

---

## Local Deployment (Recommended)

MCP servers are typically designed to run locally and communicate with MCP clients via stdio (standard input/output).

### Prerequisites

- Node.js 18+ or pnpm installed
- iCloud account with app-specific password
- MCP client (Claude Desktop, Poke, etc.)

### Step-by-Step Installation

1. **Clone the repository:**
   ```bash
   git clone -b read-only-version https://github.com/ufukkaraca/icloud-mail-mcp.git
   cd icloud-mail-mcp
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   # or
   npm install
   # or
   yarn install
   ```

3. **Build the project:**
   ```bash
   pnpm run build
   ```

4. **Create environment file (optional for testing):**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

5. **Test the server:**
   ```bash
   ICLOUD_EMAIL="your-email@icloud.com" ICLOUD_APP_PASSWORD="xxxx-xxxx-xxxx-xxxx" node dist/index.js
   ```

6. **Configure your MCP client** (see [MCP Client Integration](#mcp-client-integration))

---

## Docker Deployment

Docker provides a consistent environment and simplifies dependency management.

### Dockerfile

The repository includes a `Dockerfile` for containerization:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm && \
    pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the project
RUN pnpm run build

# Set environment variables (override at runtime)
ENV ICLOUD_EMAIL=""
ENV ICLOUD_APP_PASSWORD=""

# Run the server
CMD ["node", "dist/index.js"]
```

### Building the Docker Image

```bash
# Build the image
docker build -t icloud-mail-mcp-readonly:latest .

# Verify the image
docker images | grep icloud-mail-mcp-readonly
```

### Running with Docker

**Option 1: Using environment variables**
```bash
docker run -i \
  -e ICLOUD_EMAIL="your-email@icloud.com" \
  -e ICLOUD_APP_PASSWORD="xxxx-xxxx-xxxx-xxxx" \
  icloud-mail-mcp-readonly:latest
```

**Option 2: Using .env file**
```bash
docker run -i \
  --env-file .env \
  icloud-mail-mcp-readonly:latest
```

### Docker Compose

Create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  icloud-mail-mcp:
    build: .
    image: icloud-mail-mcp-readonly:latest
    stdin_open: true
    tty: true
    environment:
      - ICLOUD_EMAIL=${ICLOUD_EMAIL}
      - ICLOUD_APP_PASSWORD=${ICLOUD_APP_PASSWORD}
    volumes:
      - ./logs:/app/logs
```

Run with:
```bash
docker-compose up
```

### MCP Client Integration with Docker

Configure your MCP client to use the Docker container:

**Claude Desktop (macOS/Linux):**
```json
{
  "mcpServers": {
    "icloud-mail-readonly": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "ICLOUD_EMAIL=your-email@icloud.com",
        "-e", "ICLOUD_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx",
        "icloud-mail-mcp-readonly:latest"
      ]
    }
  }
}
```

---

## Railway Deployment

> ⚠️ **Note**: Railway is designed for web services. MCP servers use stdio, not HTTP. This approach sets up the server on Railway, but you'll need a way to connect to it remotely (e.g., via SSH tunnel or custom HTTP wrapper).

### Option 1: Railway with HTTP Wrapper (Advanced)

To deploy on Railway, you'll need to wrap the MCP server with an HTTP interface.

1. **Create an HTTP wrapper** (create `server-wrapper.js`):

```javascript
import { spawn } from 'child_process';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/mcp', async (req, res) => {
  const mcpProcess = spawn('node', ['dist/index.js'], {
    env: {
      ...process.env,
      ICLOUD_EMAIL: process.env.ICLOUD_EMAIL,
      ICLOUD_APP_PASSWORD: process.env.ICLOUD_APP_PASSWORD,
    }
  });

  let output = '';
  
  mcpProcess.stdout.on('data', (data) => {
    output += data.toString();
  });

  mcpProcess.stdin.write(JSON.stringify(req.body) + '\n');
  
  mcpProcess.on('close', (code) => {
    res.json({ output, code });
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', mode: 'READ-ONLY' });
});

app.listen(PORT, () => {
  console.log(`MCP HTTP Wrapper listening on port ${PORT}`);
});
```

2. **Add express to dependencies:**
```bash
pnpm add express
```

3. **Update package.json:**
```json
{
  "scripts": {
    "start": "node server-wrapper.js"
  }
}
```

4. **Deploy to Railway:**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Add environment variables
railway variables set ICLOUD_EMAIL="your-email@icloud.com"
railway variables set ICLOUD_APP_PASSWORD="xxxx-xxxx-xxxx-xxxx"

# Deploy
railway up
```

### Option 2: Railway for Development/Testing Only

If you just want to test the build on Railway:

1. **Create `railway.json`:**
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pnpm install && pnpm run build"
  },
  "deploy": {
    "startCommand": "node dist/index.js",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

2. **Deploy:**
```bash
railway up
```

> ⚠️ **Important**: This won't work for actual MCP client connections since Railway expects HTTP traffic. Use local deployment or Docker instead.

---

## Alternative Cloud Platforms

### Render

Similar to Railway, Render is designed for HTTP services. You'd need the HTTP wrapper approach.

**render.yaml:**
```yaml
services:
  - type: web
    name: icloud-mail-mcp-readonly
    env: node
    buildCommand: pnpm install && pnpm run build
    startCommand: node dist/index.js
    envVars:
      - key: ICLOUD_EMAIL
        sync: false
      - key: ICLOUD_APP_PASSWORD
        sync: false
```

### Heroku

**Procfile:**
```
web: node dist/index.js
```

**Deploy:**
```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set ICLOUD_EMAIL="your-email@icloud.com"
heroku config:set ICLOUD_APP_PASSWORD="xxxx-xxxx-xxxx-xxxx"

# Deploy
git push heroku read-only-version:main
```

### DigitalOcean App Platform

**Deploy via UI:**
1. Connect your GitHub repository
2. Select the `read-only-version` branch
3. Configure build command: `pnpm install && pnpm run build`
4. Configure run command: `node dist/index.js`
5. Add environment variables in the App Platform dashboard

### Fly.io

**fly.toml:**
```toml
app = "icloud-mail-mcp-readonly"

[build]
  builder = "paketobuildpacks/builder:base"
  buildpacks = ["gcr.io/paketo-buildpacks/nodejs"]

[env]
  PORT = "8080"

[[services]]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
```

**Deploy:**
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login

# Launch app
flyctl launch

# Set secrets
flyctl secrets set ICLOUD_EMAIL="your-email@icloud.com"
flyctl secrets set ICLOUD_APP_PASSWORD="xxxx-xxxx-xxxx-xxxx"

# Deploy
flyctl deploy
```

> 💡 **Recommendation**: For MCP servers, **local deployment** or **Docker on your local machine** is the most practical approach. Cloud deployments require additional infrastructure for remote stdio communication.

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `ICLOUD_EMAIL` | Your iCloud email address | `john@icloud.com` |
| `ICLOUD_APP_PASSWORD` | App-specific password from Apple ID | `xxxx-xxxx-xxxx-xxxx` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `IMAP_HOST` | IMAP server hostname | `imap.mail.me.com` |
| `IMAP_PORT` | IMAP server port | `993` |
| `NODE_ENV` | Environment mode | `production` |

### Getting an App-Specific Password

1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign in with your Apple ID
3. Navigate to "Sign-In and Security" → "App-Specific Passwords"
4. Click "Generate an app-specific password"
5. Enter a label (e.g., "MCP Mail Server")
6. Copy the generated password (format: `xxxx-xxxx-xxxx-xxxx`)
7. Use this password in `ICLOUD_APP_PASSWORD`

> ⚠️ **Security**: Never commit app-specific passwords to version control!

---

## MCP Client Integration

### Claude Desktop

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
        "ICLOUD_APP_PASSWORD": "xxxx-xxxx-xxxx-xxxx"
      }
    }
  }
}
```

**With Docker:**
```json
{
  "mcpServers": {
    "icloud-mail-readonly": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "ICLOUD_EMAIL=your-email@icloud.com",
        "-e", "ICLOUD_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx",
        "icloud-mail-mcp-readonly:latest"
      ]
    }
  }
}
```

### Poke (MCP Inspector)

Poke is a tool for testing and debugging MCP servers.

**Install Poke:**
```bash
npm install -g @modelcontextprotocol/inspector
```

**Test your server:**
```bash
# Direct testing
ICLOUD_EMAIL="your-email@icloud.com" \
ICLOUD_APP_PASSWORD="xxxx-xxxx-xxxx-xxxx" \
npx @modelcontextprotocol/inspector node dist/index.js

# With Docker
npx @modelcontextprotocol/inspector docker run -i --rm \
  -e ICLOUD_EMAIL="your-email@icloud.com" \
  -e ICLOUD_APP_PASSWORD="xxxx-xxxx-xxxx-xxxx" \
  icloud-mail-mcp-readonly:latest
```

### Cline (VS Code Extension)

If using Cline in VS Code:

1. Open VS Code settings (JSON)
2. Add MCP server configuration:

```json
{
  "cline.mcpServers": {
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

### Custom MCP Client

If building your own MCP client:

```javascript
import { spawn } from 'child_process';

const mcpServer = spawn('node', ['dist/index.js'], {
  env: {
    ICLOUD_EMAIL: 'your-email@icloud.com',
    ICLOUD_APP_PASSWORD: 'xxxx-xxxx-xxxx-xxxx',
  },
  stdio: ['pipe', 'pipe', 'inherit']
});

// Send MCP request
const request = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/list',
  params: {}
};

mcpServer.stdin.write(JSON.stringify(request) + '\n');

// Listen for responses
mcpServer.stdout.on('data', (data) => {
  console.log('MCP Response:', data.toString());
});
```

---

## Testing Your Deployment

### 1. Test Connection

```bash
# Run the server
ICLOUD_EMAIL="your-email@icloud.com" \
ICLOUD_APP_PASSWORD="xxxx-xxxx-xxxx-xxxx" \
node dist/index.js
```

You should see:
```
Auto-configured iCloud Mail (READ-ONLY) for your-email@icloud.com
IMAP connection ready (READ-ONLY mode)
iCloud Mail MCP Server (READ-ONLY) running on stdio
```

### 2. Test with MCP Inspector

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

Try these test commands in Poke:
1. `check_config` - Verify configuration
2. `test_connection` - Test IMAP connectivity
3. `get_mailboxes` - List all mailboxes
4. `get_messages` - Retrieve recent emails

### 3. Test Individual Tools

Create a test script `test-mcp.js`:

```javascript
import { spawn } from 'child_process';

const mcpServer = spawn('node', ['dist/index.js'], {
  env: {
    ICLOUD_EMAIL: process.env.ICLOUD_EMAIL,
    ICLOUD_APP_PASSWORD: process.env.ICLOUD_APP_PASSWORD,
  },
  stdio: ['pipe', 'pipe', 'inherit']
});

const sendRequest = (method, params) => {
  const request = {
    jsonrpc: '2.0',
    id: Date.now(),
    method,
    params
  };
  mcpServer.stdin.write(JSON.stringify(request) + '\n');
};

mcpServer.stdout.on('data', (data) => {
  console.log('Response:', data.toString());
});

// Test: List tools
setTimeout(() => sendRequest('tools/list', {}), 1000);

// Test: Check config
setTimeout(() => sendRequest('tools/call', {
  name: 'check_config',
  arguments: {}
}), 2000);

// Test: Get messages
setTimeout(() => sendRequest('tools/call', {
  name: 'get_messages',
  arguments: { limit: 5 }
}), 3000);

// Exit after tests
setTimeout(() => process.exit(0), 5000);
```

Run:
```bash
node test-mcp.js
```

### 4. Docker Testing

```bash
# Build and test
docker build -t icloud-mail-mcp-readonly:test .

docker run -i --rm \
  -e ICLOUD_EMAIL="your-email@icloud.com" \
  -e ICLOUD_APP_PASSWORD="xxxx-xxxx-xxxx-xxxx" \
  icloud-mail-mcp-readonly:test
```

---

## Security Considerations

### 1. Credential Management

✅ **DO:**
- Use app-specific passwords (never your main Apple ID password)
- Store credentials in environment variables
- Use secret management tools (AWS Secrets Manager, 1Password, etc.)
- Enable two-factor authentication on your Apple ID
- Regularly rotate app-specific passwords

❌ **DON'T:**
- Commit credentials to version control
- Share credentials in plain text
- Use your main Apple ID password
- Store credentials in configuration files
- Log credentials in application logs

### 2. Network Security

For cloud deployments:
- Use HTTPS/TLS for all connections
- Implement IP whitelisting if possible
- Use VPN for remote access
- Enable rate limiting
- Monitor for suspicious activity

### 3. Access Control

- Limit who has access to environment variables
- Use read-only iCloud Mail permissions
- Audit access logs regularly
- Implement session timeouts
- Use separate credentials for different environments

### 4. Environment Isolation

```bash
# Development
ICLOUD_EMAIL="dev-email@icloud.com"

# Staging
ICLOUD_EMAIL="staging-email@icloud.com"

# Production
ICLOUD_EMAIL="prod-email@icloud.com"
```

### 5. Docker Security

```dockerfile
# Use non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Set read-only filesystem
VOLUME ["/app/logs"]
```

### 6. Monitoring and Logging

- Monitor failed authentication attempts
- Log all MCP tool invocations
- Set up alerts for unusual activity
- Regularly review access patterns
- Keep logs for audit purposes

---

## Troubleshooting

### Common Issues

#### 1. Authentication Failed

**Error:**
```
IMAP authentication failed. Please check your app-specific password
```

**Solutions:**
- ✅ Verify you're using an app-specific password (not your Apple ID password)
- ✅ Check for typos in the password (format: `xxxx-xxxx-xxxx-xxxx`)
- ✅ Ensure 2FA is enabled on your Apple ID
- ✅ Generate a new app-specific password
- ✅ Verify the email address is correct

#### 2. Connection Timeout

**Error:**
```
IMAP connection timeout after 30 seconds
```

**Solutions:**
- ✅ Check internet connectivity
- ✅ Verify firewall allows connections to `imap.mail.me.com:993`
- ✅ Try from a different network
- ✅ Check if iCloud services are operational: [apple.com/support/systemstatus](https://www.apple.com/support/systemstatus/)

#### 3. Docker Container Exits Immediately

**Error:**
```
Container exits with code 0 or 1
```

**Solutions:**
- ✅ Check environment variables are set correctly
- ✅ Ensure container runs with `-i` (interactive) flag
- ✅ View logs: `docker logs <container-id>`
- ✅ Test locally first: `docker run -it ...`

#### 4. MCP Client Can't Connect

**Error:**
```
Failed to start MCP server
```

**Solutions:**
- ✅ Verify absolute path in MCP client config
- ✅ Check Node.js is installed and in PATH
- ✅ Build the project: `pnpm run build`
- ✅ Test server manually first
- ✅ Check MCP client logs for errors

#### 5. "Module not found" Error

**Error:**
```
Error: Cannot find module '@modelcontextprotocol/sdk'
```

**Solutions:**
- ✅ Run `pnpm install` or `npm install`
- ✅ Delete `node_modules` and reinstall
- ✅ Verify `package.json` dependencies
- ✅ Check Node.js version (requires 18+)

#### 6. Railway/Cloud Platform Issues

**Error:**
```
Web process failed to bind to $PORT
```

**Solutions:**
- ✅ Remember: MCP servers aren't designed for cloud platforms
- ✅ Use local deployment or Docker instead
- ✅ If needed, implement HTTP wrapper (see Railway section)
- ✅ Consider running locally and using ngrok/tunneling

### Debug Mode

Enable debug logging:

```bash
NODE_ENV=development \
DEBUG=* \
ICLOUD_EMAIL="your-email@icloud.com" \
ICLOUD_APP_PASSWORD="xxxx-xxxx-xxxx-xxxx" \
node dist/index.js
```

### Getting Help

1. **Check logs**: Always check console output first
2. **Test connection**: Use `test_connection` tool
3. **Verify config**: Use `check_config` tool
4. **Review documentation**: See README.md and READ-ONLY-NOTICE.md
5. **Open an issue**: https://github.com/ufukkaraca/icloud-mail-mcp/issues

---

## Performance Optimization

### 1. Connection Pooling

The IMAP connection is reused across requests for better performance.

### 2. Caching (Future Enhancement)

Consider implementing caching for:
- Mailbox lists
- Recently accessed messages
- Search results

### 3. Rate Limiting

Implement rate limiting to avoid overwhelming iCloud servers:

```javascript
// Example rate limiter
const rateLimit = {
  requests: 0,
  resetTime: Date.now() + 60000,
  max: 60 // 60 requests per minute
};
```

---

## Production Checklist

Before deploying to production:

- [ ] App-specific password generated and stored securely
- [ ] Two-factor authentication enabled on Apple ID
- [ ] Environment variables configured correctly
- [ ] Server tested locally
- [ ] All 6 read-only tools tested
- [ ] MCP client integration verified
- [ ] Logs and monitoring configured
- [ ] Security best practices implemented
- [ ] Backup credentials stored safely
- [ ] Documentation reviewed
- [ ] Team members trained on usage

---

## Additional Resources

- **Original Project**: https://github.com/minagishl/icloud-mail-mcp
- **MCP Documentation**: https://modelcontextprotocol.io
- **Apple ID Security**: https://appleid.apple.com
- **Docker Documentation**: https://docs.docker.com
- **Node.js Best Practices**: https://github.com/goldbergyoni/nodebestpractices

---

**Last Updated**: January 16, 2026  
**Version**: 2.0.0  
**Maintainer**: [@ufukkaraca](https://github.com/ufukkaraca)
