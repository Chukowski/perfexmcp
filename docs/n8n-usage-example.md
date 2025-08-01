# How to Use Enhanced MCP Server with n8n

Your MCP server at `https://mcp.akitapr.com` now supports dynamic API credentials per request!

## Enhanced Tools with Dynamic Credentials

The following tools now accept optional `api_url` and `api_key` parameters:

### Customer Tools
- `search_customers` - Search for customers
- `list_customers` - List all customers

## Example n8n Usage

### Tool Call with Dynamic Credentials

```json
{
  "tool": "search_customers",
  "parameters": {
    "keysearch": "john",
    "api_url": "https://client1.perfex.com/api",
    "api_key": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}
```

### Tool Call Using Default Environment Credentials

```json
{
  "tool": "search_customers", 
  "parameters": {
    "keysearch": "john"
  }
}
```

## Multi-Client Workflow Example

1. **Setup Variables in n8n:**
   ```
   Company A:
   - api_url_a: "https://companya.perfex.com/api"
   - api_key_a: "token_for_company_a"
   
   Company B:
   - api_url_b: "https://companyb.perfex.com/api" 
   - api_key_b: "token_for_company_b"
   ```

2. **Dynamic Tool Calls:**
   ```javascript
   // For Company A
   {
     "tool": "list_customers",
     "parameters": {
       "api_url": "{{ $vars.api_url_a }}",
       "api_key": "{{ $vars.api_key_a }}"
     }
   }
   
   // For Company B
   {
     "tool": "list_customers", 
     "parameters": {
       "api_url": "{{ $vars.api_url_b }}",
       "api_key": "{{ $vars.api_key_b }}"
     }
   }
   ```

## Benefits

✅ **Single MCP Server** - One deployment handles multiple Perfex instances
✅ **Dynamic Credentials** - Pass API credentials per request
✅ **Secure** - No hardcoded credentials in deployment  
✅ **Flexible** - Each n8n workflow can target different Perfex instances
✅ **Scalable** - Add new clients without redeployment

This approach allows you to use one MCP server deployment for all your Perfex CRM clients!