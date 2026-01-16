# MCP Client Integration Examples

Examples of integrating the read-only iCloud Mail MCP server with various MCP clients.

---

## Table of Contents

1. [Claude Desktop](#claude-desktop)
2. [MCP Inspector (Poke)](#mcp-inspector-poke)
3. [Cline (VS Code)](#cline-vs-code)
4. [Custom Node.js Client](#custom-nodejs-client)
5. [Custom Python Client](#custom-python-client)
6. [Docker Integration](#docker-integration)
7. [Testing Tools](#testing-tools)

---

## Claude Desktop

### macOS Configuration

**Location:** `~/Library/Application Support/Claude/claude_desktop_config.json`

#### Standard Setup

```json
{
  "mcpServers": {
    "icloud-mail-readonly": {
      "command": "node",
      "args": ["/Users/username/projects/icloud-mail-mcp/dist/index.js"],
      "env": {
        "ICLOUD_EMAIL": "your-email@icloud.com",
        "ICLOUD_APP_PASSWORD": "xxxx-xxxx-xxxx-xxxx"
      }
    }
  }
}
```

#### With pnpm/npm

```json
{
  "mcpServers": {
    "icloud-mail-readonly": {
      "command": "pnpm",
      "args": ["start"],
      "cwd": "/Users/username/projects/icloud-mail-mcp",
      "env": {
        "ICLOUD_EMAIL": "your-email@icloud.com",
        "ICLOUD_APP_PASSWORD": "xxxx-xxxx-xxxx-xxxx"
      }
    }
  }
}
```

### Windows Configuration

**Location:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "icloud-mail-readonly": {
      "command": "node",
      "args": ["C:\\Users\\username\\icloud-mail-mcp\\dist\\index.js"],
      "env": {
        "ICLOUD_EMAIL": "your-email@icloud.com",
        "ICLOUD_APP_PASSWORD": "xxxx-xxxx-xxxx-xxxx"
      }
    }
  }
}
```

### Linux Configuration

**Location:** `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "icloud-mail-readonly": {
      "command": "node",
      "args": ["/home/username/icloud-mail-mcp/dist/index.js"],
      "env": {
        "ICLOUD_EMAIL": "your-email@icloud.com",
        "ICLOUD_APP_PASSWORD": "xxxx-xxxx-xxxx-xxxx"
      }
    }
  }
}
```

---

## MCP Inspector (Poke)

### Installation

```bash
npm install -g @modelcontextprotocol/inspector
```

### Usage

#### Direct Node Execution

```bash
ICLOUD_EMAIL="your-email@icloud.com" \
ICLOUD_APP_PASSWORD="xxxx-xxxx-xxxx-xxxx" \
npx @modelcontextprotocol/inspector node dist/index.js
```

#### With Docker

```bash
npx @modelcontextprotocol/inspector \
  docker run -i --rm \
  -e ICLOUD_EMAIL="your-email@icloud.com" \
  -e ICLOUD_APP_PASSWORD="xxxx-xxxx-xxxx-xxxx" \
  icloud-mail-mcp-readonly
```

#### With Environment File

```bash
# Create .env file with credentials
echo "ICLOUD_EMAIL=your-email@icloud.com" > .env
echo "ICLOUD_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx" >> .env

# Run with env file
set -a && source .env && set +a
npx @modelcontextprotocol/inspector node dist/index.js
```

### Test Commands in Poke

```javascript
// List all available tools
{ "method": "tools/list", "params": {} }

// Check configuration
{ 
  "method": "tools/call",
  "params": {
    "name": "check_config",
    "arguments": {}
  }
}

// Test connection
{
  "method": "tools/call",
  "params": {
    "name": "test_connection",
    "arguments": {}
  }
}

// Get recent messages
{
  "method": "tools/call",
  "params": {
    "name": "get_messages",
    "arguments": {
      "limit": 5,
      "unreadOnly": false
    }
  }
}
```

---

## Cline (VS Code)

### Installation

1. Install Cline extension from VS Code Marketplace
2. Open VS Code settings (JSON)

### Configuration

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

### Using Cline

1. Open Command Palette (`Cmd/Ctrl + Shift + P`)
2. Type "Cline: Start"
3. Ask: "Check my recent emails using iCloud Mail"

---

## Custom Node.js Client

### Basic Example

```javascript
import { spawn } from 'child_process';
import { createInterface } from 'readline';

class MCPClient {
  constructor(email, password) {
    this.mcpProcess = spawn('node', ['dist/index.js'], {
      env: {
        ...process.env,
        ICLOUD_EMAIL: email,
        ICLOUD_APP_PASSWORD: password,
      },
      stdio: ['pipe', 'pipe', 'inherit']
    });

    this.requestId = 0;
    this.pendingRequests = new Map();

    // Parse responses
    const rl = createInterface({
      input: this.mcpProcess.stdout,
      crlfDelay: Infinity
    });

    rl.on('line', (line) => {
      try {
        const response = JSON.parse(line);
        const handler = this.pendingRequests.get(response.id);
        if (handler) {
          handler.resolve(response);
          this.pendingRequests.delete(response.id);
        }
      } catch (error) {
        console.error('Parse error:', error);
      }
    });
  }

  async call(method, params = {}) {
    const id = ++this.requestId;
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.mcpProcess.stdin.write(JSON.stringify(request) + '\n');
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  async listTools() {
    return this.call('tools/list');
  }

  async callTool(name, args) {
    return this.call('tools/call', { name, arguments: args });
  }

  close() {
    this.mcpProcess.kill();
  }
}

// Usage
const client = new MCPClient(
  'your-email@icloud.com',
  'xxxx-xxxx-xxxx-xxxx'
);

// List available tools
const tools = await client.listTools();
console.log('Available tools:', tools);

// Check configuration
const config = await client.callTool('check_config', {});
console.log('Config:', config);

// Get messages
const messages = await client.callTool('get_messages', {
  limit: 10,
  unreadOnly: true
});
console.log('Messages:', messages);

// Clean up
client.close();
```

### Advanced Example with TypeScript

```typescript
import { spawn, ChildProcess } from 'child_process';
import { createInterface } from 'readline';

interface MCPRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: number;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

class iCloudMailMCPClient {
  private process: ChildProcess;
  private requestId = 0;
  private pendingRequests = new Map<number, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }>();

  constructor(
    private email: string,
    private password: string,
    private serverPath = 'dist/index.js'
  ) {
    this.process = spawn('node', [this.serverPath], {
      env: {
        ...process.env,
        ICLOUD_EMAIL: email,
        ICLOUD_APP_PASSWORD: password,
      },
      stdio: ['pipe', 'pipe', 'inherit']
    });

    this.setupResponseHandler();
  }

  private setupResponseHandler() {
    const rl = createInterface({
      input: this.process.stdout!,
      crlfDelay: Infinity
    });

    rl.on('line', (line) => {
      try {
        const response: MCPResponse = JSON.parse(line);
        const handler = this.pendingRequests.get(response.id);
        
        if (handler) {
          if (response.error) {
            handler.reject(new Error(response.error.message));
          } else {
            handler.resolve(response.result);
          }
          this.pendingRequests.delete(response.id);
        }
      } catch (error) {
        console.error('Failed to parse response:', error);
      }
    });
  }

  private async request(method: string, params?: any): Promise<any> {
    const id = ++this.requestId;
    const request: MCPRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.process.stdin!.write(JSON.stringify(request) + '\n');

      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout after 30 seconds'));
        }
      }, 30000);
    });
  }

  async getMessages(mailbox = 'INBOX', limit = 10, unreadOnly = false) {
    return this.request('tools/call', {
      name: 'get_messages',
      arguments: { mailbox, limit, unreadOnly }
    });
  }

  async searchMessages(query: string, options?: {
    mailbox?: string;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
    fromEmail?: string;
    unreadOnly?: boolean;
  }) {
    return this.request('tools/call', {
      name: 'search_messages',
      arguments: { query, ...options }
    });
  }

  async getMailboxes() {
    return this.request('tools/call', {
      name: 'get_mailboxes',
      arguments: {}
    });
  }

  async downloadAttachment(
    messageId: string,
    attachmentIndex = 0,
    mailbox = 'INBOX'
  ) {
    return this.request('tools/call', {
      name: 'download_attachment',
      arguments: { messageId, attachmentIndex, mailbox }
    });
  }

  async testConnection() {
    return this.request('tools/call', {
      name: 'test_connection',
      arguments: {}
    });
  }

  async checkConfig() {
    return this.request('tools/call', {
      name: 'check_config',
      arguments: {}
    });
  }

  close() {
    this.process.kill();
  }
}

// Usage
const client = new iCloudMailMCPClient(
  'your-email@icloud.com',
  'xxxx-xxxx-xxxx-xxxx'
);

try {
  // Test connection
  await client.testConnection();

  // Get recent emails
  const messages = await client.getMessages('INBOX', 5, true);
  console.log('Recent messages:', messages);

  // Search emails
  const searchResults = await client.searchMessages('important', {
    dateFrom: '2026-01-01',
    limit: 20
  });
  console.log('Search results:', searchResults);
} finally {
  client.close();
}
```

---

## Custom Python Client

```python
import subprocess
import json
import os
from typing import Dict, Any, Optional

class iCloudMailMCPClient:
    def __init__(self, email: str, password: str, server_path: str = "dist/index.js"):
        self.email = email
        self.password = password
        self.request_id = 0
        
        env = os.environ.copy()
        env['ICLOUD_EMAIL'] = email
        env['ICLOUD_APP_PASSWORD'] = password
        
        self.process = subprocess.Popen(
            ['node', server_path],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env,
            text=True,
            bufsize=1
        )
    
    def _request(self, method: str, params: Optional[Dict[str, Any]] = None) -> Any:
        self.request_id += 1
        request = {
            'jsonrpc': '2.0',
            'id': self.request_id,
            'method': method,
            'params': params or {}
        }
        
        self.process.stdin.write(json.dumps(request) + '\n')
        self.process.stdin.flush()
        
        response_line = self.process.stdout.readline()
        response = json.loads(response_line)
        
        if 'error' in response:
            raise Exception(response['error']['message'])
        
        return response.get('result')
    
    def get_messages(self, mailbox: str = 'INBOX', limit: int = 10, unread_only: bool = False):
        return self._request('tools/call', {
            'name': 'get_messages',
            'arguments': {
                'mailbox': mailbox,
                'limit': limit,
                'unreadOnly': unread_only
            }
        })
    
    def search_messages(self, query: str, **kwargs):
        args = {'query': query}
        args.update(kwargs)
        return self._request('tools/call', {
            'name': 'search_messages',
            'arguments': args
        })
    
    def get_mailboxes(self):
        return self._request('tools/call', {
            'name': 'get_mailboxes',
            'arguments': {}
        })
    
    def test_connection(self):
        return self._request('tools/call', {
            'name': 'test_connection',
            'arguments': {}
        })
    
    def close(self):
        self.process.terminate()
        self.process.wait()

# Usage
client = iCloudMailMCPClient(
    email='your-email@icloud.com',
    password='xxxx-xxxx-xxxx-xxxx'
)

try:
    # Test connection
    print(client.test_connection())
    
    # Get messages
    messages = client.get_messages(limit=5, unread_only=True)
    print(f"Found {len(messages)} unread messages")
    
    # Search
    results = client.search_messages('meeting', limit=10)
    print(f"Found {len(results)} messages about meetings")
finally:
    client.close()
```

---

## Docker Integration

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
        "icloud-mail-mcp-readonly:latest"
      ]
    }
  }
}
```

### Docker Compose with MCP Client

```yaml
version: '3.8'

services:
  mcp-server:
    image: icloud-mail-mcp-readonly:latest
    stdin_open: true
    tty: true
    environment:
      - ICLOUD_EMAIL=${ICLOUD_EMAIL}
      - ICLOUD_APP_PASSWORD=${ICLOUD_APP_PASSWORD}
    volumes:
      - ./logs:/app/logs
```

---

## Testing Tools

### Simple Test Script

```bash
#!/bin/bash
# test-mcp.sh

echo "Testing iCloud Mail MCP Server"

echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
ICLOUD_EMAIL="your-email@icloud.com" \
ICLOUD_APP_PASSWORD="xxxx-xxxx-xxxx-xxxx" \
node dist/index.js
```

### Comprehensive Test Suite

See `test-mcp.js` in the repository for a full test suite.

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `ICLOUD_EMAIL` | Yes | Your iCloud email |
| `ICLOUD_APP_PASSWORD` | Yes | App-specific password |
| `NODE_ENV` | No | Environment (production/development) |
| `IMAP_HOST` | No | IMAP server (default: imap.mail.me.com) |
| `IMAP_PORT` | No | IMAP port (default: 993) |

---

For more examples and documentation, see:
- [README.md](README.md)
- [DEPLOYMENT.md](DEPLOYMENT.md)
- [QUICK-START.md](QUICK-START.md)
