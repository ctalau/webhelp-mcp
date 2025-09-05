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

### Vercel deployment

https://webhelp-mcp.vercel.app/<site>

https://webhelp-mcp.vercel.app/www.oxygenxml.com/doc/versions/27.0.0/ug-waCustom/
