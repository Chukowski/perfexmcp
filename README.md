# Perfex CRM MCP Server

A Model Context Protocol (MCP) server that connects to Perfex CRM, enabling AI assistants to interact with your CRM data through a standardized interface.

## Overview

This MCP server provides AI assistants with the ability to:
- Search and manage customers
- View and create invoices
- Access task information
- Manage leads
- Interact with other Perfex CRM entities

## Features

### Supported Operations

#### Customer Management
- **search_customers** - Search for customers by keyword
- **list_customers** - List all customers in the system
- **get_customer_by_id** - Get detailed customer information
- **create_customer** - Create new customers

#### Invoice Management
- **list_invoices** - List all invoices
- **get_invoice_by_id** - Get detailed invoice information

#### Task Management
- **get_task_by_id** - Get detailed task information

#### Lead Management
- **list_leads** - List all leads
- **create_lead** - Create new leads

### Resources
- **Customer Search** - Direct access to customer search results via `perfex://customers/search/{keysearch}` URIs

## Prerequisites

- Node.js 18+ or Docker
- Access to a Perfex CRM instance with API enabled
- Perfex CRM API credentials

## Installation & Setup

### Option 1: Local Development

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd perfex-crm-server
   npm install
   ```

2. **Build the server:**
   ```bash
   npm run build
   ```

3. **Set environment variables:**
   ```bash
   export PERFEX_API_URL="https://your-perfex-instance.com/api"
   export PERFEX_API_KEY="your-api-key"
   ```

4. **Run the server:**
   ```bash
   npm run build && node build/index.js
   ```

### Option 2: Docker

1. **Build the Docker image:**
   ```bash
   docker build -t perfex-mcp-server .
   ```

2. **Run with Docker:**
   ```bash
   docker run -e PERFEX_API_URL="https://your-perfex-instance.com/api" \
              -e PERFEX_API_KEY="your-api-key" \
              perfex-mcp-server
   ```

### Option 3: Docker Compose

1. **Create a `.env` file:**
   ```env
   PERFEX_API_URL=https://your-perfex-instance.com/api
   PERFEX_API_KEY=your-api-key
   ```

2. **Run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PERFEX_API_URL` | Base URL of your Perfex CRM API endpoint | Yes |
| `PERFEX_API_KEY` | Your Perfex CRM API authentication token | Yes |

### Perfex CRM API Setup

1. Log into your Perfex CRM admin panel
2. Go to **Setup** → **API**
3. Enable the API and generate an API key
4. Note the API endpoint URL (usually `https://your-domain.com/api`)

## MCP Client Configuration

### Claude Desktop

Add the server to your Claude Desktop configuration:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "perfex-crm": {
      "command": "/path/to/perfex-crm-server/build/index.js",
      "env": {
        "PERFEX_API_URL": "https://your-perfex-instance.com/api",
        "PERFEX_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Other MCP Clients

For other MCP-compatible clients, configure the server to run via stdio transport with the appropriate environment variables.

## Usage Examples

Once configured, you can ask your AI assistant to:

- "Search for customers with the name 'Acme'"
- "List all customers in the system"
- "Show me details for customer ID 123"
- "Create a new customer for XYZ Corp"
- "List all invoices"
- "Show me invoice details for invoice 456"
- "List all leads in the system"
- "Create a new lead for potential client"

## API Coverage

This MCP server currently implements core Perfex CRM operations. The API coverage includes:

- ✅ Customer operations (search, list, get, create)
- ✅ Invoice operations (list, get)
- ✅ Task operations (get)
- ✅ Lead operations (list, create)
- 🔄 Additional operations can be added as needed

## Development

### Building
```bash
npm run build
```

### Development with auto-rebuild
```bash
npm run watch
```

### Debugging

Since MCP servers communicate over stdio, debugging can be challenging. Use the MCP Inspector:

```bash
npm run inspector
```

The Inspector provides a web interface for testing and debugging the MCP server.

### Testing

You can test the server functionality using the MCP Inspector or by integrating it with a compatible MCP client.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MCP Client    │◄──►│   MCP Server    │◄──►│   Perfex CRM    │
│  (Claude, etc.) │    │   (This App)    │    │      API        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

The server acts as a bridge between MCP clients and the Perfex CRM API, translating MCP tool calls into appropriate API requests.

## Error Handling

The server includes comprehensive error handling for:
- Invalid API credentials
- Network connectivity issues
- Malformed API responses
- Invalid input parameters
- Rate limiting (if applicable)

## Security Considerations

- Store API credentials securely using environment variables
- Use HTTPS for all API communications
- The Docker image runs as a non-root user for security
- Validate all input parameters before making API calls

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues related to:
- **MCP Server**: Open an issue in this repository
- **Perfex CRM API**: Consult the Perfex CRM documentation
- **MCP Protocol**: See the [MCP specification](https://modelcontextprotocol.io)

## Changelog

### v0.2.0
- Complete code refactoring and cleanup
- Added Docker support
- Improved error handling
- Added proper TypeScript types
- Removed duplicate code
- Added comprehensive documentation

### v0.1.0
- Initial release with basic functionality