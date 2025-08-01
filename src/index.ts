#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import { z } from 'zod';

// Environment variables
const API_URL = process.env.PERFEX_API_URL;
const API_KEY = process.env.PERFEX_API_KEY;

// Validation
if (!API_URL || !API_KEY) {
  throw new Error('PERFEX_API_URL and PERFEX_API_KEY environment variables are required');
}

console.error(`[Perfex MCP] API_URL: ${API_URL ? 'Loaded' : 'MISSING'}`);
console.error(`[Perfex MCP] API_KEY: ${API_KEY ? 'Loaded (' + API_KEY.substring(0, 5) + '...)' : 'MISSING'}`);

// HTTP client configuration
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'authtoken': API_KEY,
    'Content-Type': 'application/json',
  },
});

// Types
interface PerfexResponse {
  data: any;
  success: boolean;
  message?: string;
}

interface PerfexStatusResponse {
  status: boolean;
  message: string;
  error?: any;
}

class PerfexCRMServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'perfex-crm',
        version: '0.2.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.setupResourceHandlers();
    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupResourceHandlers() {
    // Customer search resource template
    this.server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => ({
      resourceTemplates: [
        {
          uriTemplate: 'perfex://customers/search/{keysearch}',
          name: 'Search customers by keyword',
          mimeType: 'application/json',
          description: 'Search for customers in Perfex CRM using a search term',
        },
      ],
    }));

    // Read customer search results
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const match = request.params.uri.match(/^perfex:\/\/customers\/search\/([^/]+)$/);
      if (!match) {
        throw new McpError(ErrorCode.InvalidRequest, `Invalid URI format: ${request.params.uri}`);
      }
      const keysearch = decodeURIComponent(match[1]);
      try {
        const response = await apiClient.get(`/customers/search/${keysearch}`);
        const customerData = response.data;
        if (!Array.isArray(customerData)) {
          throw new McpError(ErrorCode.InternalError, 'Perfex API returned unexpected data format for resource search customers.');
        }
        return {
          contents: [
            {
              uri: request.params.uri,
              mimeType: 'application/json',
              text: JSON.stringify(customerData, null, 2)
            }
          ]
        };
      } catch (error) {
        this.handleApiError(error, `resource search customers for "${keysearch}"`);
        throw new McpError(ErrorCode.InternalError, 'Failed to read resource.');
      }
    });
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // Customer tools
        {
          name: 'search_customers',
          description: 'Search for customers in Perfex CRM',
          inputSchema: {
            type: 'object',
            properties: {
              keysearch: {
                type: 'string',
                description: 'Search term to find customers',
              },
            },
            required: ['keysearch'],
          },
        },
        {
          name: 'list_customers',
          description: 'List all customers',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_customer_by_id',
          description: 'Get detailed information about a specific customer',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                description: 'Customer unique ID',
              },
            },
            required: ['id'],
          },
        },
        {
          name: 'create_customer',
          description: 'Create a new customer',
          inputSchema: {
            type: 'object',
            properties: {
              company: {
                type: 'string',
                description: 'Company name (required)',
              },
              vat: {
                type: 'string',
                description: 'VAT/Tax ID number',
              },
              phonenumber: {
                type: 'string',
                description: 'Phone number',
              },
              website: {
                type: 'string',
                description: 'Website URL',
              },
              address: {
                type: 'string',
                description: 'Address',
              },
              city: {
                type: 'string',
                description: 'City',
              },
              state: {
                type: 'string',
                description: 'State/Province',
              },
              zip: {
                type: 'string',
                description: 'ZIP/Postal code',
              },
              country: {
                type: 'integer',
                description: 'Country ID',
              },
            },
            required: ['company'],
          },
        },
        // Invoice tools
        {
          name: 'list_invoices',
          description: 'List all invoices',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_invoice_by_id',
          description: 'Get detailed information about a specific invoice',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                description: 'Invoice unique ID',
              },
            },
            required: ['id'],
          },
        },
        // Task tools
        {
          name: 'get_task_by_id',
          description: 'Get detailed information about a specific task',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                description: 'Task unique ID',
              },
            },
            required: ['id'],
          },
        },
        // Lead tools
        {
          name: 'list_leads',
          description: 'List all leads',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'create_lead',
          description: 'Create a new lead',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Lead name (required)',
              },
              source: {
                type: 'integer',
                description: 'Lead source ID (required)',
              },
              status: {
                type: 'integer',
                description: 'Lead status ID (required)',
              },
              assigned: {
                type: 'integer',
                description: 'Assigned staff ID (required)',
              },
              email: {
                type: 'string',
                description: 'Email address',
              },
              phonenumber: {
                type: 'string',
                description: 'Phone number',
              },
              company: {
                type: 'string',
                description: 'Company name',
              },
            },
            required: ['name', 'source', 'status', 'assigned'],
          },
        },
        {
          name: 'get_lead_by_id',
          description: 'Get detailed information about a specific lead',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                description: 'Lead unique ID',
              },
            },
            required: ['id'],
          },
        },
        {
          name: 'update_lead',
          description: 'Update an existing lead',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                description: 'Lead unique ID (required)',
              },
              name: {
                type: 'string',
                description: 'Lead name',
              },
              source: {
                type: 'integer',
                description: 'Lead source ID',
              },
              status: {
                type: 'integer',
                description: 'Lead status ID',
              },
              assigned: {
                type: 'integer',
                description: 'Assigned staff ID',
              },
              email: {
                type: 'string',
                description: 'Email address',
              },
              phonenumber: {
                type: 'string',
                description: 'Phone number',
              },
              company: {
                type: 'string',
                description: 'Company name',
              },
            },
            required: ['id'],
          },
        },
        {
          name: 'search_leads',
          description: 'Search for leads by keyword',
          inputSchema: {
            type: 'object',
            properties: {
              keysearch: {
                type: 'string',
                description: 'Search term to find leads',
              },
            },
            required: ['keysearch'],
          },
        },
        {
          name: 'delete_lead',
          description: 'Delete a lead permanently',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                description: 'Lead unique ID to delete',
              },
            },
            required: ['id'],
          },
        },
        // Proposal tools
        {
          name: 'list_proposals',
          description: 'List all proposals',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'create_proposal',
          description: 'Create a new proposal',
          inputSchema: {
            type: 'object',
            properties: {
              subject: {
                type: 'string',
                description: 'Proposal subject (required)',
              },
              rel_type: {
                type: 'string',
                description: 'Related type: lead, customer (required)',
              },
              rel_id: {
                type: 'integer',
                description: 'Related ID (Lead or Customer ID) (required)',
              },
              date: {
                type: 'string',
                description: 'Proposal date (YYYY-MM-DD) (required)',
              },
              currency: {
                type: 'integer',
                description: 'Currency ID (required)',
              },
              assigned: {
                type: 'integer',
                description: 'Assigned staff ID',
              },
              content: {
                type: 'string',
                description: 'Proposal content (HTML)',
              },
            },
            required: ['subject', 'rel_type', 'rel_id', 'date', 'currency'],
          },
        },
        {
          name: 'get_proposal_by_id',
          description: 'Get detailed information about a specific proposal',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                description: 'Proposal unique ID',
              },
            },
            required: ['id'],
          },
        },
        {
          name: 'update_proposal',
          description: 'Update an existing proposal',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                description: 'Proposal unique ID (required)',
              },
              subject: {
                type: 'string',
                description: 'Proposal subject',
              },
              rel_type: {
                type: 'string',
                description: 'Related type: lead, customer',
              },
              rel_id: {
                type: 'integer',
                description: 'Related ID (Lead or Customer ID)',
              },
              date: {
                type: 'string',
                description: 'Proposal date (YYYY-MM-DD)',
              },
              currency: {
                type: 'integer',
                description: 'Currency ID',
              },
              assigned: {
                type: 'integer',
                description: 'Assigned staff ID',
              },
              content: {
                type: 'string',
                description: 'Proposal content (HTML)',
              },
            },
            required: ['id'],
          },
        },
        {
          name: 'search_proposals',
          description: 'Search for proposals by keyword',
          inputSchema: {
            type: 'object',
            properties: {
              keysearch: {
                type: 'string',
                description: 'Search term to find proposals',
              },
            },
            required: ['keysearch'],
          },
        },
        {
          name: 'delete_proposal',
          description: 'Delete a proposal permanently',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                description: 'Proposal unique ID to delete',
              },
            },
            required: ['id'],
          },
        },
        // Estimate tools
        {
          name: 'list_estimates',
          description: 'List all estimates',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'create_estimate',
          description: 'Create a new estimate',
          inputSchema: {
            type: 'object',
            properties: {
              clientid: {
                type: 'integer',
                description: 'Customer ID (required)',
              },
              number: {
                type: 'integer',
                description: 'Estimate number (required)',
              },
              date: {
                type: 'string',
                description: 'Estimate date (YYYY-MM-DD) (required)',
              },
              currency: {
                type: 'integer',
                description: 'Currency ID (required)',
              },
              subtotal: {
                type: 'number',
                description: 'Calculated subtotal (required)',
              },
              total: {
                type: 'number',
                description: 'Calculated total (required)',
              },
              duedate: {
                type: 'string',
                description: 'Due date (YYYY-MM-DD)',
              },
            },
            required: ['clientid', 'number', 'date', 'currency', 'subtotal', 'total'],
          },
        },
        {
          name: 'get_estimate_by_id',
          description: 'Get detailed information about a specific estimate',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                description: 'Estimate unique ID',
              },
            },
            required: ['id'],
          },
        },
        {
          name: 'update_estimate',
          description: 'Update an existing estimate',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                description: 'Estimate unique ID (required)',
              },
              clientid: {
                type: 'integer',
                description: 'Customer ID',
              },
              number: {
                type: 'integer',
                description: 'Estimate number',
              },
              date: {
                type: 'string',
                description: 'Estimate date (YYYY-MM-DD)',
              },
              currency: {
                type: 'integer',
                description: 'Currency ID',
              },
              subtotal: {
                type: 'number',
                description: 'Calculated subtotal',
              },
              total: {
                type: 'number',
                description: 'Calculated total',
              },
              status: {
                type: 'integer',
                description: 'Estimate status ID',
              },
            },
            required: ['id'],
          },
        },
        {
          name: 'search_estimates',
          description: 'Search for estimates by keyword',
          inputSchema: {
            type: 'object',
            properties: {
              keysearch: {
                type: 'string',
                description: 'Search term to find estimates',
              },
            },
            required: ['keysearch'],
          },
        },
        {
          name: 'delete_estimate',
          description: 'Delete an estimate permanently',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                description: 'Estimate unique ID to delete',
              },
            },
            required: ['id'],
          },
        },
        // Calendar tools
        {
          name: 'list_calendar_events',
          description: 'List all calendar events',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'create_calendar_event',
          description: 'Create a new calendar event',
          inputSchema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'Event title (required)',
              },
              start: {
                type: 'string',
                description: 'Start date/time (YYYY-MM-DD HH:MM:SS) (required)',
              },
              end: {
                type: 'string',
                description: 'End date/time (YYYY-MM-DD HH:MM:SS)',
              },
              description: {
                type: 'string',
                description: 'Event description',
              },
              userid: {
                type: 'integer',
                description: 'User ID (required)',
              },
              reminder_before: {
                type: 'integer',
                description: 'Reminder before value (required)',
              },
              reminder_before_type: {
                type: 'string',
                description: 'Reminder type: minutes, hours, days (required)',
              },
              public: {
                type: 'integer',
                description: 'Public event: 1 or 0 (required)',
              },
              color: {
                type: 'string',
                description: 'Event color (hex code)',
              },
            },
            required: ['title', 'start', 'userid', 'reminder_before', 'reminder_before_type', 'public'],
          },
        },
        {
          name: 'get_calendar_event_by_id',
          description: 'Get detailed information about a specific calendar event',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                description: 'Calendar event unique ID',
              },
            },
            required: ['id'],
          },
        },
        {
          name: 'update_calendar_event',
          description: 'Update an existing calendar event',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                description: 'Calendar event unique ID (required)',
              },
              title: {
                type: 'string',
                description: 'Event title',
              },
              start: {
                type: 'string',
                description: 'Start date/time (YYYY-MM-DD HH:MM:SS)',
              },
              end: {
                type: 'string',
                description: 'End date/time (YYYY-MM-DD HH:MM:SS)',
              },
              description: {
                type: 'string',
                description: 'Event description',
              },
              userid: {
                type: 'integer',
                description: 'User ID',
              },
              reminder_before: {
                type: 'integer',
                description: 'Reminder before value',
              },
              reminder_before_type: {
                type: 'string',
                description: 'Reminder type: minutes, hours, days',
              },
              public: {
                type: 'integer',
                description: 'Public event: 1 or 0',
              },
              color: {
                type: 'string',
                description: 'Event color (hex code)',
              },
            },
            required: ['id'],
          },
        },
        {
          name: 'delete_calendar_event',
          description: 'Delete a calendar event permanently',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                description: 'Calendar event unique ID to delete',
              },
            },
            required: ['id'],
          },
        },
        // Contact tools
        {
          name: 'create_contact',
          description: 'Create a new contact',
          inputSchema: {
            type: 'object',
            properties: {
              customer_id: {
                type: 'integer',
                description: 'Customer ID (required)',
              },
              firstname: {
                type: 'string',
                description: 'First name (required)',
              },
              lastname: {
                type: 'string',
                description: 'Last name (required)',
              },
              email: {
                type: 'string',
                description: 'Email address (required)',
              },
              phonenumber: {
                type: 'string',
                description: 'Phone number',
              },
              title: {
                type: 'string',
                description: 'Job title',
              },
              is_primary: {
                type: 'integer',
                description: 'Primary contact: 1 or 0',
              },
            },
            required: ['customer_id', 'firstname', 'lastname', 'email'],
          },
        },
        {
          name: 'get_customer_contacts',
          description: 'Get all contacts for a customer or a specific contact',
          inputSchema: {
            type: 'object',
            properties: {
              customer_id: {
                type: 'integer',
                description: 'Customer ID (required)',
              },
              contact_id: {
                type: 'integer',
                description: 'Specific contact ID (optional)',
              },
            },
            required: ['customer_id'],
          },
        },
        {
          name: 'update_contact',
          description: 'Update an existing contact',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                description: 'Contact unique ID (required)',
              },
              firstname: {
                type: 'string',
                description: 'First name',
              },
              lastname: {
                type: 'string',
                description: 'Last name',
              },
              email: {
                type: 'string',
                description: 'Email address',
              },
              phonenumber: {
                type: 'string',
                description: 'Phone number',
              },
              title: {
                type: 'string',
                description: 'Job title',
              },
              is_primary: {
                type: 'integer',
                description: 'Primary contact: 1 or 0',
              },
            },
            required: ['id'],
          },
        },
        {
          name: 'search_contacts',
          description: 'Search for contacts by keyword',
          inputSchema: {
            type: 'object',
            properties: {
              keysearch: {
                type: 'string',
                description: 'Search term to find contacts',
              },
            },
            required: ['keysearch'],
          },
        },
        {
          name: 'delete_contact',
          description: 'Delete a contact permanently',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                description: 'Contact unique ID to delete',
              },
            },
            required: ['id'],
          },
        },
        // Project tools
        {
          name: 'create_project',
          description: 'Create a new project',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Project name (required)',
              },
              rel_type: {
                type: 'string',
                description: 'Related type: lead, customer, internal (required)',
              },
              clientid: {
                type: 'integer',
                description: 'Related ID (Lead or Customer ID, 0 for internal) (required)',
              },
              billing_type: {
                type: 'integer',
                description: 'Billing type ID (required)',
              },
              start_date: {
                type: 'string',
                description: 'Start date (YYYY-MM-DD) (required)',
              },
              status: {
                type: 'integer',
                description: 'Project status ID (required)',
              },
              deadline: {
                type: 'string',
                description: 'Deadline (YYYY-MM-DD)',
              },
              description: {
                type: 'string',
                description: 'Project description',
              },
              project_cost: {
                type: 'number',
                description: 'Project cost',
              },
              estimated_hours: {
                type: 'number',
                description: 'Estimated hours',
              },
            },
            required: ['name', 'rel_type', 'clientid', 'billing_type', 'start_date', 'status'],
          },
        },
        {
          name: 'get_project_by_id',
          description: 'Get detailed information about a specific project',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                description: 'Project unique ID',
              },
            },
            required: ['id'],
          },
        },
        {
          name: 'update_project',
          description: 'Update an existing project',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                description: 'Project unique ID (required)',
              },
              name: {
                type: 'string',
                description: 'Project name',
              },
              rel_type: {
                type: 'string',
                description: 'Related type: lead, customer, internal',
              },
              clientid: {
                type: 'integer',
                description: 'Related ID (Lead or Customer ID)',
              },
              billing_type: {
                type: 'integer',
                description: 'Billing type ID',
              },
              start_date: {
                type: 'string',
                description: 'Start date (YYYY-MM-DD)',
              },
              status: {
                type: 'integer',
                description: 'Project status ID',
              },
              deadline: {
                type: 'string',
                description: 'Deadline (YYYY-MM-DD)',
              },
              description: {
                type: 'string',
                description: 'Project description',
              },
              project_cost: {
                type: 'number',
                description: 'Project cost',
              },
              estimated_hours: {
                type: 'number',
                description: 'Estimated hours',
              },
            },
            required: ['id'],
          },
        },
        {
          name: 'search_projects',
          description: 'Search for projects by keyword',
          inputSchema: {
            type: 'object',
            properties: {
              keysearch: {
                type: 'string',
                description: 'Search term to find projects',
              },
            },
            required: ['keysearch'],
          },
        },
        {
          name: 'delete_project',
          description: 'Delete a project permanently',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                description: 'Project unique ID to delete',
              },
            },
            required: ['id'],
          },
        },
        // Expense tools
        {
          name: 'create_expense',
          description: 'Create a new expense',
          inputSchema: {
            type: 'object',
            properties: {
              category: {
                type: 'integer',
                description: 'Expense category ID (required)',
              },
              amount: {
                type: 'number',
                description: 'Expense amount (required)',
              },
              date: {
                type: 'string',
                description: 'Expense date (YYYY-MM-DD) (required)',
              },
              currency: {
                type: 'integer',
                description: 'Currency ID (required)',
              },
              note: {
                type: 'string',
                description: 'Expense note/description',
              },
              paymentmode: {
                type: 'integer',
                description: 'Payment mode ID',
              },
              reference_no: {
                type: 'string',
                description: 'Reference number',
              },
            },
            required: ['category', 'amount', 'date', 'currency'],
          },
        },
        {
          name: 'get_expense_by_id',
          description: 'Get detailed information about a specific expense',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                description: 'Expense unique ID',
              },
            },
            required: ['id'],
          },
        },
        {
          name: 'update_expense',
          description: 'Update an existing expense',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                description: 'Expense unique ID (required)',
              },
              category: {
                type: 'integer',
                description: 'Expense category ID',
              },
              amount: {
                type: 'number',
                description: 'Expense amount',
              },
              date: {
                type: 'string',
                description: 'Expense date (YYYY-MM-DD)',
              },
              currency: {
                type: 'integer',
                description: 'Currency ID',
              },
              note: {
                type: 'string',
                description: 'Expense note/description',
              },
              paymentmode: {
                type: 'integer',
                description: 'Payment mode ID',
              },
              reference_no: {
                type: 'string',
                description: 'Reference number',
              },
            },
            required: ['id'],
          },
        },
        {
          name: 'search_expenses',
          description: 'Search for expenses by keyword',
          inputSchema: {
            type: 'object',
            properties: {
              keysearch: {
                type: 'string',
                description: 'Search term to find expenses',
              },
            },
            required: ['keysearch'],
          },
        },
        {
          name: 'delete_expense',
          description: 'Delete an expense permanently',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                description: 'Expense unique ID to delete',
              },
            },
            required: ['id'],
          },
        },
        // Common data tools
        {
          name: 'list_expense_categories',
          description: 'List all expense categories',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'list_payment_modes',
          description: 'List all payment modes',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'list_taxes',
          description: 'List all taxes',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    }));

    // Tool implementations
    this.server.setRequestHandler(CallToolRequestSchema, async (req) => {
      try {
        const toolName = req.params.name;
        const args = req.params.arguments;

        switch (toolName) {
          // Customer handlers
          case 'search_customers':
            return await this.handleSearchCustomers(args);
          case 'list_customers':
            return await this.handleListCustomers();
          case 'get_customer_by_id':
            return await this.handleGetCustomerById(args);
          case 'create_customer':
            return await this.handleCreateCustomer(args);
          
          // Invoice handlers
          case 'list_invoices':
            return await this.handleListInvoices();
          case 'get_invoice_by_id':
            return await this.handleGetInvoiceById(args);
          
          // Task handlers
          case 'get_task_by_id':
            return await this.handleGetTaskById(args);
          
          // Lead handlers
          case 'list_leads':
            return await this.handleListLeads();
          case 'create_lead':
            return await this.handleCreateLead(args);
          case 'get_lead_by_id':
            return await this.handleGetLeadById(args);
          case 'update_lead':
            return await this.handleUpdateLead(args);
          case 'search_leads':
            return await this.handleSearchLeads(args);
          case 'delete_lead':
            return await this.handleDeleteLead(args);
          
          // Proposal handlers
          case 'list_proposals':
            return await this.handleListProposals();
          case 'create_proposal':
            return await this.handleCreateProposal(args);
          case 'get_proposal_by_id':
            return await this.handleGetProposalById(args);
          case 'update_proposal':
            return await this.handleUpdateProposal(args);
          case 'search_proposals':
            return await this.handleSearchProposals(args);
          case 'delete_proposal':
            return await this.handleDeleteProposal(args);
          
          // Estimate handlers
          case 'list_estimates':
            return await this.handleListEstimates();
          case 'create_estimate':
            return await this.handleCreateEstimate(args);
          case 'get_estimate_by_id':
            return await this.handleGetEstimateById(args);
          case 'update_estimate':
            return await this.handleUpdateEstimate(args);
          case 'search_estimates':
            return await this.handleSearchEstimates(args);
          case 'delete_estimate':
            return await this.handleDeleteEstimate(args);
          
          // Calendar handlers
          case 'list_calendar_events':
            return await this.handleListCalendarEvents();
          case 'create_calendar_event':
            return await this.handleCreateCalendarEvent(args);
          case 'get_calendar_event_by_id':
            return await this.handleGetCalendarEventById(args);
          case 'update_calendar_event':
            return await this.handleUpdateCalendarEvent(args);
          case 'delete_calendar_event':
            return await this.handleDeleteCalendarEvent(args);
          
          // Contact handlers
          case 'create_contact':
            return await this.handleCreateContact(args);
          case 'get_customer_contacts':
            return await this.handleGetCustomerContacts(args);
          case 'update_contact':
            return await this.handleUpdateContact(args);
          case 'search_contacts':
            return await this.handleSearchContacts(args);
          case 'delete_contact':
            return await this.handleDeleteContact(args);
          
          // Project handlers
          case 'create_project':
            return await this.handleCreateProject(args);
          case 'get_project_by_id':
            return await this.handleGetProjectById(args);
          case 'update_project':
            return await this.handleUpdateProject(args);
          case 'search_projects':
            return await this.handleSearchProjects(args);
          case 'delete_project':
            return await this.handleDeleteProject(args);
          
          // Expense handlers
          case 'create_expense':
            return await this.handleCreateExpense(args);
          case 'get_expense_by_id':
            return await this.handleGetExpenseById(args);
          case 'update_expense':
            return await this.handleUpdateExpense(args);
          case 'search_expenses':
            return await this.handleSearchExpenses(args);
          case 'delete_expense':
            return await this.handleDeleteExpense(args);
          
          // Common data handlers
          case 'list_expense_categories':
            return await this.handleListExpenseCategories();
          case 'list_payment_modes':
            return await this.handleListPaymentModes();
          case 'list_taxes':
            return await this.handleListTaxes();
          
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${toolName}`);
        }
      } catch (error: any) {
        this.handleApiError(error, `execute tool ${req.params.name}`);
        throw error;
      }
    });
  }

  // Customer handlers
  private async handleSearchCustomers(args: any) {
    const validation = z.object({ keysearch: z.string() }).safeParse(args);
    if (!validation.success) {
      throw new McpError(ErrorCode.InvalidParams, 'keysearch must be a string');
    }

    try {
      const response = await apiClient.get(`/customers/search/${encodeURIComponent(validation.data.keysearch)}`);
      const customerData = response.data;
      
      if (!Array.isArray(customerData)) {
        throw new McpError(ErrorCode.InternalError, 'Perfex API returned unexpected data format for search customers.');
      }
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(customerData, null, 2)
          }
        ]
      };
    } catch (error) {
      this.handleApiError(error, `search customers for "${validation.data.keysearch}"`);
      throw error;
    }
  }

  private async handleListCustomers() {
    try {
      const response = await apiClient.get('/customers');
      const customers = response.data;

      if (!Array.isArray(customers)) {
        throw new McpError(ErrorCode.InternalError, 'Invalid API response format for listCustomers. Expected array.');
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(customers, null, 2),
          },
        ],
      };
    } catch (error) {
      this.handleApiError(error, 'list customers');
      throw error;
    }
  }

  private async handleGetCustomerById(args: any) {
    const validation = z.object({ id: z.union([z.number(), z.string()]) }).safeParse(args);
    if (!validation.success) {
      throw new McpError(ErrorCode.InvalidParams, 'id must be provided');
    }

    try {
      const response = await apiClient.get(`/customers/${validation.data.id}`);
      const customerData = response.data;
      
      if (!customerData || typeof customerData !== 'object') {
        throw new McpError(ErrorCode.InternalError, 'Unexpected response format from API');
      }
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(customerData, null, 2)
          }
        ]
      };
    } catch (error) {
      this.handleApiError(error, `get customer ${validation.data.id}`);
      throw error;
    }
  }

  private async handleCreateCustomer(args: any) {
    const validation = z.object({
      company: z.string().min(1),
      vat: z.string().optional(),
      phonenumber: z.string().optional(),
      website: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
      country: z.number().optional(),
    }).safeParse(args);

    if (!validation.success) {
      throw new McpError(ErrorCode.InvalidParams, `Invalid arguments: ${validation.error.message}`);
    }

    try {
      const response = await apiClient.post('/customers', validation.data);
      return this.handleGenericApiResponse(response.data, 'create customer');
    } catch (error) {
      this.handleApiError(error, 'create customer');
      throw error;
    }
  }

  // Invoice handlers
  private async handleListInvoices() {
    try {
      const response = await apiClient.get('/invoices');
      const invoices = response.data;

      if (!Array.isArray(invoices)) {
        throw new McpError(ErrorCode.InternalError, 'Invalid API response format for listInvoices. Expected array.');
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(invoices, null, 2),
          },
        ],
      };
    } catch (error) {
      this.handleApiError(error, 'list invoices');
      throw error;
    }
  }

  private async handleGetInvoiceById(args: any) {
    const validation = z.object({ id: z.union([z.number(), z.string()]) }).safeParse(args);
    if (!validation.success) {
      throw new McpError(ErrorCode.InvalidParams, 'id must be provided');
    }

    try {
      const response = await apiClient.get(`/invoices/${validation.data.id}`);
      const invoiceData = response.data;
      
      if (!invoiceData || typeof invoiceData !== 'object') {
        throw new McpError(ErrorCode.InternalError, 'Unexpected response format from API');
      }
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(invoiceData, null, 2)
          }
        ]
      };
    } catch (error) {
      this.handleApiError(error, `get invoice ${validation.data.id}`);
      throw error;
    }
  }

  // Task handlers
  private async handleGetTaskById(args: any) {
    const validation = z.object({ id: z.union([z.number(), z.string()]) }).safeParse(args);
    if (!validation.success) {
      throw new McpError(ErrorCode.InvalidParams, 'id must be provided');
    }

    try {
      const response = await apiClient.get(`/tasks/${validation.data.id}`);
      const taskData = response.data;

      if (!taskData || typeof taskData !== 'object') {
        throw new McpError(ErrorCode.InternalError, 'Unexpected response format from API');
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(taskData, null, 2),
          },
        ],
      };
    } catch (error) {
      this.handleApiError(error, `get task ${validation.data.id}`);
      throw error;
    }
  }

  // Lead handlers
  private async handleListLeads() {
    try {
      const response = await apiClient.get('/leads');
      const leads = response.data;

      if (!Array.isArray(leads)) {
        throw new McpError(ErrorCode.InternalError, 'Invalid API response format for listLeads. Expected array.');
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(leads, null, 2),
          },
        ],
      };
    } catch (error) {
      this.handleApiError(error, 'list leads');
      throw error;
    }
  }

  private async handleCreateLead(args: any) {
    const validation = z.object({
      name: z.string().min(1),
      source: z.union([z.string(), z.number()]),
      status: z.union([z.string(), z.number()]),
      assigned: z.union([z.string(), z.number()]),
      email: z.string().optional(),
      phonenumber: z.string().optional(),
      company: z.string().optional(),
    }).safeParse(args);

    if (!validation.success) {
      throw new McpError(ErrorCode.InvalidParams, `Invalid arguments: ${validation.error.message}`);
    }

    try {
      const response = await apiClient.post('/leads', validation.data);
      return this.handleGenericApiResponse(response.data, 'create lead');
    } catch (error) {
      this.handleApiError(error, 'create lead');
      throw error;
    }
  }

  // Additional Lead handlers
  private async handleGetLeadById(args: any) {
    const validation = z.object({ id: z.union([z.number(), z.string()]) }).safeParse(args);
    if (!validation.success) {
      throw new McpError(ErrorCode.InvalidParams, 'id must be provided');
    }

    try {
      const response = await apiClient.get(`/leads/${validation.data.id}`);
      const leadData = response.data;
      
      if (!leadData || typeof leadData !== 'object') {
        throw new McpError(ErrorCode.InternalError, 'Unexpected response format from API');
      }
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(leadData, null, 2)
          }
        ]
      };
    } catch (error) {
      this.handleApiError(error, `get lead ${validation.data.id}`);
      throw error;
    }
  }

  private async handleUpdateLead(args: any) {
    const validation = z.object({
      id: z.union([z.number(), z.string()]),
      name: z.string().optional(),
      source: z.union([z.string(), z.number()]).optional(),
      status: z.union([z.string(), z.number()]).optional(),
      assigned: z.union([z.string(), z.number()]).optional(),
      email: z.string().optional(),
      phonenumber: z.string().optional(),
      company: z.string().optional(),
    }).safeParse(args);

    if (!validation.success) {
      throw new McpError(ErrorCode.InvalidParams, `Invalid arguments: ${validation.error.message}`);
    }

    try {
      const leadId = validation.data.id;
      const updateData = { ...validation.data };
      delete (updateData as any).id;
      
      const response = await apiClient.put(`/leads/${leadId}`, updateData);
      return this.handleGenericApiResponse(response.data, 'update lead');
    } catch (error) {
      this.handleApiError(error, `update lead ${validation.data.id}`);
      throw error;
    }
  }

  private async handleSearchLeads(args: any) {
    const validation = z.object({ keysearch: z.string() }).safeParse(args);
    if (!validation.success) {
      throw new McpError(ErrorCode.InvalidParams, 'keysearch must be a string');
    }

    try {
      const response = await apiClient.get(`/leads/search/${encodeURIComponent(validation.data.keysearch)}`);
      const leadData = response.data;
      
      if (!Array.isArray(leadData)) {
        throw new McpError(ErrorCode.InternalError, 'Perfex API returned unexpected data format for search leads.');
      }
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(leadData, null, 2)
          }
        ]
      };
    } catch (error) {
      this.handleApiError(error, `search leads for "${validation.data.keysearch}"`);
      throw error;
    }
  }

  private async handleDeleteLead(args: any) {
    const validation = z.object({ id: z.union([z.number(), z.string()]) }).safeParse(args);
    if (!validation.success) {
      throw new McpError(ErrorCode.InvalidParams, 'id must be provided');
    }

    try {
      const response = await apiClient.delete(`/delete/leads/${validation.data.id}`);
      return this.handleGenericApiResponse(response.data, 'delete lead');
    } catch (error) {
      this.handleApiError(error, `delete lead ${validation.data.id}`);
      throw error;
    }
  }

  // Proposal handlers
  private async handleListProposals() {
    try {
      const response = await apiClient.get('/proposals');
      const proposals = response.data;

      if (!Array.isArray(proposals)) {
        throw new McpError(ErrorCode.InternalError, 'Invalid API response format for listProposals. Expected array.');
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(proposals, null, 2),
          },
        ],
      };
    } catch (error) {
      this.handleApiError(error, 'list proposals');
      throw error;
    }
  }

  private async handleCreateProposal(args: any) {
    const validation = z.object({
      subject: z.string().min(1),
      rel_type: z.string(),
      rel_id: z.number(),
      date: z.string(),
      currency: z.number(),
      assigned: z.number().optional(),
      content: z.string().optional(),
    }).safeParse(args);

    if (!validation.success) {
      throw new McpError(ErrorCode.InvalidParams, `Invalid arguments: ${validation.error.message}`);
    }

    try {
      const response = await apiClient.post('/proposals', validation.data);
      return this.handleGenericApiResponse(response.data, 'create proposal');
    } catch (error) {
      this.handleApiError(error, 'create proposal');
      throw error;
    }
  }

  private async handleGetProposalById(args: any) {
    const validation = z.object({ id: z.union([z.number(), z.string()]) }).safeParse(args);
    if (!validation.success) {
      throw new McpError(ErrorCode.InvalidParams, 'id must be provided');
    }

    try {
      const response = await apiClient.get(`/proposals/${validation.data.id}`);
      const proposalData = response.data;
      
      if (!proposalData || typeof proposalData !== 'object') {
        throw new McpError(ErrorCode.InternalError, 'Unexpected response format from API');
      }
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(proposalData, null, 2)
          }
        ]
      };
    } catch (error) {
      this.handleApiError(error, `get proposal ${validation.data.id}`);
      throw error;
    }
  }

  private async handleUpdateProposal(args: any) {
    const validation = z.object({
      id: z.union([z.number(), z.string()]),
      subject: z.string().optional(),
      rel_type: z.string().optional(),
      rel_id: z.number().optional(),
      date: z.string().optional(),
      currency: z.number().optional(),
      assigned: z.number().optional(),
      content: z.string().optional(),
    }).safeParse(args);

    if (!validation.success) {
      throw new McpError(ErrorCode.InvalidParams, `Invalid arguments: ${validation.error.message}`);
    }

    try {
      const proposalId = validation.data.id;
      const updateData = { ...validation.data };
      delete (updateData as any).id;
      
      const response = await apiClient.put(`/proposals/${proposalId}`, updateData);
      return this.handleGenericApiResponse(response.data, 'update proposal');
    } catch (error) {
      this.handleApiError(error, `update proposal ${validation.data.id}`);
      throw error;
    }
  }

  private async handleSearchProposals(args: any) {
    const validation = z.object({ keysearch: z.string() }).safeParse(args);
    if (!validation.success) {
      throw new McpError(ErrorCode.InvalidParams, 'keysearch must be a string');
    }

    try {
      const response = await apiClient.get(`/proposals/search/${encodeURIComponent(validation.data.keysearch)}`);
      const proposalData = response.data;
      
      if (!Array.isArray(proposalData)) {
        throw new McpError(ErrorCode.InternalError, 'Perfex API returned unexpected data format for search proposals.');
      }
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(proposalData, null, 2)
          }
        ]
      };
    } catch (error) {
      this.handleApiError(error, `search proposals for "${validation.data.keysearch}"`);
      throw error;
    }
  }

  private async handleDeleteProposal(args: any) {
    const validation = z.object({ id: z.union([z.number(), z.string()]) }).safeParse(args);
    if (!validation.success) {
      throw new McpError(ErrorCode.InvalidParams, 'id must be provided');
    }

    try {
      const response = await apiClient.delete(`/proposals/${validation.data.id}`);
      return this.handleGenericApiResponse(response.data, 'delete proposal');
    } catch (error) {
      this.handleApiError(error, `delete proposal ${validation.data.id}`);
      throw error;
    }
  }

  // Helper methods
  private handleGenericApiResponse(data: any, operation: string) {
    if (data?.success || data?.status === true) {
      const message = data.message || `${operation} completed successfully`;
      const id = data.id || data.leadid || data.customerid || '';
      return {
        content: [
          {
            type: 'text',
            text: id ? `${message}. ID: ${id}` : message,
          },
        ],
      };
    } else {
      const errorMessage = data?.message || `${operation} failed`;
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  }

  private handleApiError(error: any, operation: string): never {
    if (error instanceof McpError) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || 
                          (typeof error.response?.data === 'string' ? error.response.data : error.message) || 
                          'Unknown API error';
      
      console.error(`[Perfex API Error] ${operation}:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
      
      throw new McpError(
        ErrorCode.InternalError,
        `Perfex API error during ${operation}: ${errorMessage}`
      );
    }

    console.error(`[Unexpected Error] ${operation}:`, error);
    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed during ${operation}: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Perfex CRM MCP server running on stdio');
  }
}

const server = new PerfexCRMServer();
server.run().catch(console.error);