# WebHelp Search MCP


## Installation

```bash
npm install
```

## Usage

### CLI Usage

```bash
npm run search-cli https://userguide.sync.ro/content-fusion "commit workspace changes"
```

### MCP testing

```bash
PORT=3001 npm run start 
```

Test it
```bash
 NO_PROXY="localhost" claude --mcp-config claude-mcp-config.json --debug --permission-mode bypassPermissions
```
