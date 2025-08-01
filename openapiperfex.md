Okay, here is the Perfex API documentation converted into an OpenAPI 3.0.3 specification in YAML format.

**Key Considerations & Assumptions:**

1.  **Base URL:** I've used a server variable `{yourdomain}` for the base URL (`https://{yourdomain}.com/api`). You'll need to replace `{yourdomain}` with the actual domain when using this spec.
2.  **Authentication:** Defined an API Key security scheme named `ApiKeyAuth` expecting the token in the `authtoken` header, applied globally.
3.  **Data Types:** Mapped documentation types (String, Int, Number, Text, Date, DateTime, etc.) to standard OpenAPI types (`string`, `integer`, `number`, `boolean`) and formats (`date`, `date-time`, `int64`, `float`, `double`). `Text`, `Varchar` map to `string`. `TinyInt` often maps to `integer` or `boolean` (used `integer` here, assuming 0/1). `BigInt` maps to `integer` with `format: int64`. `Decimal` maps to `number` (`format: float` or `double` often used, chose `float` as default). `ID` is generally assumed to be `integer` or `string` depending on context; used `integer` where it seemed numeric, `string` otherwise or if path parameter.
4.  **Request Bodies (POST/PUT):** The documentation states `multipart/form-data` is used. This is reflected in the spec for POST/PUT operations.
5.  **Response Schemas:** Created reusable schemas under `components/schemas` for common objects (Customer, Item, Subscription, Error responses, etc.) to keep the spec DRY. Response examples from the documentation are included where provided.
6.  **Custom Fields:** This is complex due to the dynamic nature (`custom_fields[type][id]`).
    *   GET responses include a `customfields` array property containing objects with `label` and `value`.
    *   POST/PUT request bodies include a `custom_fields` property defined as a generic `object` with `additionalProperties: true`. This allows sending arbitrary key-value pairs as described, although it doesn't strictly enforce the `[type][id]` structure within the schema itself. A description is added to explain this.
    *   The specific `/custom_fields/{FieldBelongsto}/{id}` endpoint is defined.
    *   The other "Custom Fields" sections (Add, Delete, Request, Search, Update with N/A paths) are interpreted as *instructions* on how custom fields interact with *other* resource endpoints, not standalone endpoints themselves. Their logic is incorporated into the schemas of the relevant resources.
7.  **Optionality:** Parameters are marked `required: true` only when explicitly stated as "Mandatory" or if they are path parameters. Others are assumed optional.
8.  **Error Handling:** Defined common error responses (e.g., 400 Bad Request, 404 Not Found, 409 Conflict) with basic schemas based on examples.
9.  **DELETE Paths:** The documentation uses non-standard paths like `/delete/contacts/:id`. These have been kept as documented, although standard REST would typically be `DELETE /contacts/:id`.
10. **Success/Error Messages:** Created reusable schemas like `SuccessMessageResponse` and `ErrorResponseSimple` for common `{ "status": boolean, "message": string }` structures.
11. **IDs:** Used `operationId` for easier code generation.
12. **Completeness:** Tried to capture all endpoints and parameters. Some descriptions or types might need refinement based on actual API behavior if the documentation is slightly ambiguous. Array item structures (like `newitems`) are sometimes inferred or kept generic (`type: object`) if not detailed.

```yaml
openapi: 3.0.3
info:
  title: Perfex CRM API
  description: |
    👋 Introduction
    Perfex API operates over HTTP/HTTPS and uses JSON as its data format. It is a RESTful API and utilizes HTTP methods and HTTP status codes to specify requests and responses.
    To get started using the API you first need an API token, after activating our module, through your API Management section (Perfex CRM's admin dashboard) and assign the respective permissions to it.

    👨‍💻 Installation
    → Download our API module from CodeCanyon and upload it in the Modules section of your Perfex CRM installation.
    → Press Activate and enter your license key.

    ✏️ Create an API token
    → Sign in into Perfex's CRM backend as an admin, go to API → API Management, and create a new token.
    → Make sure to copy the token and that you fill all necessary information (permissions etc).

    ⛓️ Usage of the API
    Available commands of the API are described below, along with their request-response examples for every endpoint.
    We are using authtoken header value for authentication and multipart-form type for data operations (POST/PUT).

    ⚛ Custom fields
    All commands do support custom fields (starting from version 1.0.2).
    Please take a look at the Custom Fields section in order to ensure the correct implementation of each request that includes Custom Fields.
  version: "1.0.2" # Inferred from custom fields note

servers:
  - url: https://{yourdomain}.com/api
    description: Perfex CRM API Server
    variables:
      yourdomain:
        default: mysite.com # Example domain
        description: Your Perfex CRM domain name

components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: authtoken
      description: API Token generated from Perfex Admin -> API Management.

  schemas:
    # Generic Responses
    ErrorResponseSimple:
      type: object
      properties:
        status:
          type: boolean
          example: false
        message:
          type: string
      required:
        - status
        - message
    ErrorResponseDetailed:
      type: object
      properties:
        status:
          type: boolean
          example: false
        error:
          type: object
          additionalProperties:
            type: string
          example: {"email": "This Email is already exists"}
        message:
          type: string
          example: "This Email is already exists"
      required:
        - status
        - error
        - message
    SuccessMessageResponse:
      type: object
      properties:
        status:
          type: boolean
          example: true
        message:
          type: string
      required:
        - status
        - message
    PaymentSuccessMessageResponse: # Specific naming due to documentation 'paymentmode' field
      type: object
      properties:
        paymentmode:
          type: boolean
          example: true
        message:
          type: string
      required:
        - paymentmode
        - message
    PaymentErrorResponse: # Specific naming due to documentation 'paymentmode' field
      type: object
      properties:
        paymentmode:
          type: boolean
          example: false
        message:
          type: string
      required:
        - paymentmode
        - message

    # Custom Fields Structure (as seen in responses)
    CustomFieldItem:
      type: object
      properties:
        label:
          type: string
          example: "Input 1"
        value:
          # Value can be string, number, array stringified etc. Using flexible type.
          type: "string"
          nullable: true
          example: "test 12"
    CustomFieldDetail:
      type: object
      properties:
        field_name:
          type: string
          example: "custom_fields[invoice][1]"
        custom_field_id:
          type: string # Although numeric in example, keeping as string for flexibility
          example: "1"
        label:
          type: string
          example: "Input 1"
        required:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "0"
        type:
          type: string
          example: "input"
        value:
          type: "string" # Can be complex (JSON string for arrays/options)
          nullable: true
          example: "input1 data"
        options:
          type: string # JSON string representation of options array
          nullable: true
          example: "[\"Option 1\",\"Option 2\",\"Option 3\"]"

    # Resource Schemas
    Customer:
      type: object
      properties:
        userid:
          type: string # Can be large number, string safer
          example: "3"
        company:
          type: string
          nullable: true
          example: "Jk Technologies"
        vat:
          type: string
          nullable: true
          example: "1234567890"
        phonenumber:
          type: string
          nullable: true
          example: "1234567890"
        country:
          type: string # Seems to be country ID
          example: "102"
        city:
          type: string
          nullable: true
          example: "Test City"
        zip:
          type: string
          nullable: true
          example: "123456"
        state:
          type: string
          nullable: true
          example: "Test State"
        address:
          type: string
          nullable: true
          example: "Test Address"
        website:
          type: string
          format: uri
          nullable: true
          example: "https://example.com"
        datecreated:
          type: string
          format: date-time
          example: "2019-11-29 12:34:56"
        active:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "1"
        leadid:
          type: string # Can be large number, string safer
          nullable: true
          example: null
        billing_street:
          type: string
          nullable: true
          example: ""
        billing_city:
          type: string
          nullable: true
          example: ""
        billing_state:
          type: string
          nullable: true
          example: ""
        billing_zip:
          type: string
          nullable: true
          example: ""
        billing_country:
          type: string # Seems to be country ID
          example: "0"
        shipping_street:
          type: string
          nullable: true
          example: ""
        shipping_city:
          type: string
          nullable: true
          example: ""
        shipping_state:
          type: string
          nullable: true
          example: ""
        shipping_zip:
          type: string
          nullable: true
          example: ""
        shipping_country:
          type: string # Seems to be country ID
          example: "0"
        longitude:
          type: number
          format: float
          nullable: true
          example: null
        latitude:
          type: number
          format: float
          nullable: true
          example: null
        default_language:
          type: string
          nullable: true
          example: "english"
        default_currency:
          type: string # Seems to be currency ID
          example: "3"
        show_primary_contact:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "0"
        stripe_id:
          type: string
          nullable: true
          example: null
        registration_confirmed:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "1"
        addedfrom:
          type: string # User ID, string safer
          example: "8"
        # Potential other fields from different GET examples
        id: # From Project GET example, assuming same as userid
          type: string
          example: "28"
        name: # From Project GET example, assuming same as company
          type: string
          example: "Test1"
        description: # From Project GET example
          type: string
          nullable: true
        status: # From Project GET example, assuming same as active
          type: string
          enum: ["0", "1"] # Assuming 0/1 like 'active'
          example: "1"
        clientid: # From Project GET example, seems same as userid
          type: string
          example: "11"
        # ... include other fields if they appear consistently for a Customer object ...
        customfields:
          type: array
          items:
            $ref: '#/components/schemas/CustomFieldItem'

    Item:
      type: object
      properties:
        itemid:
          type: string
          example: "1"
        rate:
          type: string # Representing decimal
          example: "100.00"
        taxrate:
          type: string # Representing decimal
          nullable: true
          example: "5.00"
        taxid:
          type: string # ID
          nullable: true
          example: "1"
        taxname:
          type: string
          nullable: true
          example: "PAYPAL"
        taxrate_2:
          type: string # Representing decimal
          nullable: true
          example: "9.00"
        taxid_2:
          type: string # ID
          nullable: true
          example: "2"
        taxname_2:
          type: string
          nullable: true
          example: "CGST"
        description:
          type: string
          example: "JBL Soundbar"
        long_description:
          type: string
          nullable: true
          example: "The JBL Cinema SB110 is a hassle-free soundbar"
        group_id:
          type: string # ID
          example: "0"
        group_name:
          type: string
          nullable: true
          example: null
        unit:
          type: string
          nullable: true
          example: ""
        # Fields from Search response
        id:
          type: string
          example: "1"
        name:
          type: string
          example: "(100.00) JBL Soundbar"
        subtext:
          type: string
          example: "The JBL Cinema SB110 is a hassle-free soundbar..."
        customfields:
          type: array
          items:
            $ref: '#/components/schemas/CustomFieldItem'

    Subscription:
      type: object
      # Define properties based on GET response example
      # Note: Example uses key => type 'value' format, translate to OpenAPI properties
      properties:
        name:
          type: string
          example: 'New  subscription'
        description:
          type: string
          example: 'This is a detailed description of subscription'
        description_in_item:
          type: integer # tinyint
          example: 1
        clientid:
          type: integer
          example: 123
        date:
          type: string
          format: date
          example: '2024-01-31'
        terms:
          type: string
          example: 'subscription payment is due'
        currency: # Mismatched key name in docs ('currency ' vs 'currency') - using 'currency'
          type: integer
          example: 4
        tax_id: # Mismatched key name in docs ('tax_id ' vs 'tax_id') - using 'tax_id'
          type: integer
          example: 456
        stripe_tax_id_2:
          type: string
          example: 'tax-789'
        stripe_plan_id:
          type: string
          example: 'subscription_ABC'
        tax_id_2: # Mismatched key name in docs ('tax_id_2': vs 'tax_id_2') - using 'tax_id_2'
          type: integer
          example: 12
        stripe_subscription_id:
          type: string # text
          example: 'sub_123456789'
        next_billing_cycle:
          type: integer
          format: int64 # bigint timestamp
          example: 1643808000
        ends_at:
          type: integer
          format: int64 # bigint timestamp
          example: 1646486400
        status:
          type: string
          example: 'active'
        quantity:
          type: integer
          example: 5
        project_id:
          type: integer
          example: 789
        hash:
          type: string
          example: 'a1b2c3'
        created:
          type: string
          format: date-time
          example: '2024-01-31 12:34:56'
        created_from:
          type: integer
          example: 1
        date_subscribed:
          type: string
          format: date-time
          example: '2024-01-31 10:00:00'
        in_test_environment:
          type: integer # int
          example: 1
        last_sent_at:
          type: string
          format: date-time
          example: '2024-01-31 14:45:00'
        # Assuming an ID field would exist if retrieved individually
        id:
          type: integer
          description: The unique identifier for the subscription.
        customfields:
          type: array
          items:
            $ref: '#/components/schemas/CustomFieldItem'

    Timesheet:
      type: object
      properties:
        id:
          type: integer
          description: The unique identifier for the timesheet.
        task_id:
          type: string # Example shows string
          example: "2"
        start_time:
          type: string
          format: time # Assuming HH:MM:SS format
          example: "10:00:00"
        end_time:
          type: string
          format: time # Assuming HH:MM:SS format
          example: "12:00:00"
        staff_id: # Mismatched key name in docs ('staff_id ' vs 'staff_id') - using 'staff_id'
          type: string # Example shows string
          example: "2"
        hourly_rate:
          type: string # Represents decimal
          example: "5.00"
        note:
          type: string
          nullable: true
          example: "testing note"
        customfields:
          type: array
          items:
            $ref: '#/components/schemas/CustomFieldItem'

    CalendarEvent:
      type: object
      properties:
        eventid:
          type: string # Example shows string
          example: "1"
        title:
          type: string
          example: "Hello"
        description:
          type: string
          nullable: true
          example: "test"
        userid:
          type: string # Example shows string
          example: "1"
        start:
          type: string
          format: date-time
          example: "2023-12-12 07:00:00"
        end:
          # Example '2023-12-12 07:00:00' looks like date-time but is shown as number in one example? Assuming date-time
          type: string
          format: date-time
          example: "2023-12-12 07:00:00"
        public:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "1"
        color:
          type: string
          example: "#03a9f4"
        isstartnotified:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "0"
        reminder_before:
          type: string # Example '30', seems numeric but stored as string?
          example: "30"
        reminder_before_type:
          type: string
          example: "minutes"
        customfields:
          type: array
          items:
            $ref: '#/components/schemas/CustomFieldItem'

    Contact:
      type: object
      properties:
        # Properties from List/Search response
        id:
          type: string # Example shows string
          example: "6"
        userid:
          type: string # Customer ID, example shows string
          example: "1"
        company:
          type: string
          nullable: true
          example: "xyz"
        vat:
          type: string
          nullable: true
          example: ""
        phonenumber:
          type: string
          nullable: true
          example: "1234567890"
        country:
          type: string # Country ID
          example: "0"
        city:
          type: string
          nullable: true
          example: ""
        zip:
          type: string
          nullable: true
          example: "360005"
        state:
          type: string
          nullable: true
          example: ""
        address:
          type: string
          nullable: true
          example: ""
        website:
          type: string
          format: uri
          nullable: true
          example: ""
        datecreated:
          type: string
          format: date-time
          example: "2020-08-19 20:07:49"
        active:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "1"
        leadid:
          type: string
          nullable: true
          example: null
        billing_street:
          type: string
          nullable: true
          example: ""
        billing_city:
          type: string
          nullable: true
          example: ""
        billing_state:
          type: string
          nullable: true
          example: ""
        billing_zip:
          type: string
          nullable: true
          example: ""
        billing_country:
          type: string # Country ID
          example: "0"
        shipping_street:
          type: string
          nullable: true
          example: ""
        shipping_city:
          type: string
          nullable: true
          example: ""
        shipping_state:
          type: string
          nullable: true
          example: ""
        shipping_zip:
          type: string
          nullable: true
          example: ""
        shipping_country:
          type: string # Country ID
          example: "0"
        longitude:
          type: number
          format: float
          nullable: true
          example: null
        latitude:
          type: number
          format: float
          nullable: true
          example: null
        default_language:
          type: string
          nullable: true
          example: "english"
        default_currency:
          type: string # Currency ID
          example: "0"
        show_primary_contact:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "0"
        stripe_id:
          type: string
          nullable: true
          example: null
        registration_confirmed:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "1"
        addedfrom:
          type: string # User ID
          example: "1"
        # Additional fields from Search response
        is_primary:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "0"
        firstname:
          type: string
          example: "chirag"
        lastname:
          type: string
          example: "jagani"
        email:
          type: string
          format: email
          example: "useremail@gmail.com"
        title:
          type: string
          nullable: true
          example: null
        password: # Hashed password
          type: string
          example: "$2a$08$6DLJFalqvJGVymCwW2ppNe9HOG5YUP04vzthXZjOFFUQknxfG6QHe"
        new_pass_key:
          type: string
          nullable: true
        new_pass_key_requested:
          type: string
          format: date-time
          nullable: true
        email_verified_at:
          type: string
          format: date-time
          nullable: true
          example: "2020-08-28 21:36:06"
        email_verification_key:
          type: string
          nullable: true
        email_verification_sent_at:
          type: string
          format: date-time
          nullable: true
        last_ip:
          type: string
          format: ipv4 # or ipv6
          nullable: true
        last_login:
          type: string
          format: date-time
          nullable: true
        last_password_change:
          type: string
          format: date-time
          nullable: true
        profile_image:
          type: string
          nullable: true
        direction:
          type: string
          enum: [rtl, ltr]
          nullable: true
        invoice_emails:
          type: string # '0' or '1' maybe?
          example: "0"
        estimate_emails:
          type: string
          example: "0"
        credit_note_emails:
          type: string
          example: "0"
        contract_emails:
          type: string
          example: "0"
        task_emails:
          type: string
          example: "0"
        project_emails:
          type: string
          example: "0"
        ticket_emails:
          type: string
          example: "0"
        customfields:
          type: array
          items:
            $ref: '#/components/schemas/CustomFieldItem'

    Contract:
      type: object
      properties:
        id:
          type: string # Example shows string
          example: "1"
        content:
          type: string
          nullable: true
          example: ""
        description:
          type: string
          nullable: true
          example: "Lorem Ipsum..."
        subject:
          type: string
          example: "New Contract"
        client:
          type: string # Customer ID
          example: "9"
        datestart:
          type: string
          format: date
          example: "2022-11-21"
        dateend:
          type: string
          format: date
          nullable: true
          example: "2027-11-21"
        contract_type:
          type: string # Type ID
          example: "1"
        project_id:
          type: string # Project ID
          example: "0"
        addedfrom:
          type: string # User ID
          example: "1"
        dateadded:
          type: string
          format: date-time
          example: "2022-11-21 12:45:58"
        isexpirynotified:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "0"
        contract_value:
          type: string # Represents decimal
          nullable: true
          example: "13456.00"
        trash:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "0"
        not_visible_to_client:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "0"
        hash:
          type: string
          example: "31caaa36b9ea1f45a688c7e859d3ae70"
        signed:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "0"
        signature:
          type: string # Path or data?
          nullable: true
        marked_as_signed:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "0"
        acceptance_firstname:
          type: string
          nullable: true
        acceptance_lastname:
          type: string
          nullable: true
        acceptance_email:
          type: string
          format: email
          nullable: true
        acceptance_date:
          type: string
          format: date-time
          nullable: true
        acceptance_ip:
          type: string
          format: ipv4 # or ipv6
          nullable: true
        short_link:
          type: string
          format: uri
          nullable: true
        name: # Contract type name
          type: string
          nullable: true
          example: "Development Contracts"
        userid: # Related Customer ID
          type: string
          example: "9"
        company: # Related Customer Company
          type: string
          example: "8web"
        # ... include other customer fields from example if needed ...
        type_name: # Contract type name (duplicate?)
          type: string
          nullable: true
          example: "Development Contracts"
        attachments:
          type: array # Structure unknown
          items:
            type: object
        customfields:
          type: array
          items:
            $ref: '#/components/schemas/CustomFieldItem'

    CreditNoteItem: # Structure inferred for POST/PUT
       type: object
       properties:
         description:
           type: string
         long_description:
           type: string
         rate:
           type: number
           format: float
         qty:
           type: integer
         unit:
           type: string
         taxname: # Assuming tax can be specified by name or ID
           type: string
         taxname_2:
           type: string

    CreditNote:
      type: object
      properties:
        # From GET response example
        id:
          type: string # Example shows string
          example: "2"
        clientid:
          type: string # Example shows string
          example: "1"
        deleted_customer_name:
          type: string
          nullable: true
        number:
          type: string # Example shows string
          example: "2"
        prefix:
          type: string
          example: "CN-"
        number_format:
          type: string # Example shows string
          example: "1"
        datecreated:
          type: string
          format: date-time
          example: "2021-07-30 16:29:46"
        date:
          type: string
          format: date
          example: "2021-08-02"
        adminnote:
          type: string
          nullable: true
          example: "adminnote2"
        terms:
          type: string
          nullable: true
          example: ""
        clientnote:
          type: string
          nullable: true
          example: ""
        currency:
          type: string # Currency ID
          example: "1"
        subtotal:
          type: string # Represents decimal
          example: "1200.00"
        total_tax:
          type: string # Represents decimal
          example: "0.00"
        total:
          type: string # Represents decimal
          example: "1200.00"
        adjustment:
          type: string # Represents decimal
          example: "0.00"
        addedfrom:
          type: string # User ID
          example: "1"
        status:
          type: string # Status ID
          example: "1"
        project_id:
          type: string # Project ID
          example: "0"
        discount_percent:
          type: string # Represents decimal
          example: "0.00"
        discount_total:
          type: string # Represents decimal
          example: "0.00"
        discount_type:
          type: string
          nullable: true
          example: ""
        billing_street:
          type: string
          nullable: true
          example: "Test"
        billing_city:
          type: string
          nullable: true
          example: "Test"
        billing_state:
          type: string
          nullable: true
          example: "Test"
        billing_zip:
          type: string
          nullable: true
          example: "3000"
        billing_country:
          type: string # Country ID
          example: "102"
        shipping_street:
          type: string
          nullable: true
          example: "Test"
        shipping_city:
          type: string
          nullable: true
          example: "Test"
        shipping_state:
          type: string
          nullable: true
          example: "Test"
        shipping_zip:
          type: string
          nullable: true
          example: "3000"
        shipping_country:
          type: string # Country ID
          example: "102"
        include_shipping:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "1"
        show_shipping_on_credit_note:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "1"
        show_quantity_as:
          type: string # Example shows string
          example: "1"
        reference_no:
          type: string
          nullable: true
          example: ""
        userid: # Related customer ID
          type: string
          example: "1"
        company: # Related customer company
          type: string
          example: "Test"
        # ... include other customer fields from example if needed ...
        credit_note_id: # Duplicate of 'id'?
          type: string
          example: "2"
        customfields:
          type: array
          items:
            $ref: '#/components/schemas/CustomFieldItem'
        # Potential fields from search response (seem identical)
        items: # Items likely included in single GET but not shown in example
          type: array
          items:
            $ref: '#/components/schemas/InvoiceItem' # Reuse InvoiceItem schema likely similar
        attachments: # Likely included in single GET
          type: array
          items:
            type: object # Structure unknown

    InvoiceItem: # Structure inferred from GET /invoices/{id} example
      type: object
      properties:
        id:
          type: string # Example shows string
          example: "2"
        rel_id:
          type: string # Example shows string, matches invoice ID
          example: "2"
        rel_type:
          type: string
          example: "invoice"
        description:
          type: string
          example: "12MP Dual Camera with cover"
        long_description:
          type: string
          nullable: true
          example: "The JBL Cinema SB110 is a hassle-free soundbar"
        qty:
          type: string # Represents decimal
          example: "1.00"
        rate:
          type: string # Represents decimal
          example: "5.00"
        unit:
          type: string
          nullable: true
          example: ""
        item_order:
          type: string # Example shows string
          example: "1"
        customfields: # Custom fields can be on items too
          type: array
          items:
            $ref: '#/components/schemas/CustomFieldItem'

    Invoice:
      type: object
      properties:
        # Properties from GET /invoices/{id} example
        id:
          type: string # Example shows string
          example: "2"
        sent:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "0"
        datesend:
          type: string
          format: date-time
          nullable: true
        clientid:
          type: string # Example shows string
          example: "1"
        deleted_customer_name:
          type: string
          nullable: true
        number:
          type: string # Example shows string
          example: "2"
        prefix:
          type: string
          example: "INV-"
        number_format:
          type: string # Example shows string
          example: "1"
        datecreated:
          type: string
          format: date-time
          example: "2020-05-26 19:53:11"
        date:
          type: string
          format: date
          example: "2020-05-26"
        duedate:
          type: string
          format: date
          nullable: true
          example: "2020-06-25"
        currency:
          type: string # Currency ID
          example: "1"
        subtotal:
          type: string # Represents decimal
          example: "5.00"
        total_tax:
          type: string # Represents decimal
          example: "0.00"
        total:
          type: string # Represents decimal
          example: "5.00"
        adjustment:
          type: string # Represents decimal
          example: "0.00"
        addedfrom:
          type: string # User ID
          example: "0" # Can be 0?
        hash:
          type: string
          example: "7bfac86da004df5364407574d4d1dbf2"
        status:
          type: string # Status ID
          example: "1"
        clientnote:
          type: string
          nullable: true
        adminnote:
          type: string
          nullable: true
        last_overdue_reminder:
          type: string
          format: date-time
          nullable: true
        cancel_overdue_reminders:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "0"
        allowed_payment_modes:
          type: string # Serialized array? Example: "['1']"
          example: "['1']"
        token:
          type: string
          nullable: true
        discount_percent:
          type: string # Represents decimal
          example: "0.00"
        discount_total:
          type: string # Represents decimal
          example: "0.00"
        discount_type:
          type: string
          nullable: true
          example: ""
        recurring:
          type: string # '0' or recurring period ID?
          example: "0"
        recurring_type:
          type: string
          nullable: true
        custom_recurring:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "0"
        cycles:
          type: string # Example shows string
          example: "0"
        total_cycles:
          type: string # Example shows string
          example: "0"
        is_recurring_from:
          type: string # Invoice ID?
          nullable: true
        last_recurring_date:
          type: string
          format: date
          nullable: true
        terms:
          type: string
          nullable: true
        sale_agent:
          type: string # Staff ID
          example: "0"
        billing_street:
          type: string
          nullable: true
          example: ""
        billing_city:
          type: string
          nullable: true
          example: ""
        billing_state:
          type: string
          nullable: true
          example: ""
        billing_zip:
          type: string
          nullable: true
          example: ""
        billing_country:
          type: string # Country ID
          nullable: true
        shipping_street:
          type: string
          nullable: true
        shipping_city:
          type: string
          nullable: true
        shipping_state:
          type: string
          nullable: true
        shipping_zip:
          type: string
          nullable: true
        shipping_country:
          type: string # Country ID
          nullable: true
        include_shipping:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "0"
        show_shipping_on_invoice:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "1"
        show_quantity_as:
          type: string # Example shows string
          example: "1"
        project_id:
          type: string # Project ID
          example: "0"
        subscription_id:
          type: string # Subscription ID
          example: "0"
        # Currency details (often joined in GET requests)
        symbol:
          type: string
          example: "$"
        name: # Currency name
          type: string
          example: "USD"
        decimal_separator:
          type: string
          example: "."
        thousand_separator:
          type: string
          example: ","
        placement:
          type: string
          enum: [before, after]
          example: "before"
        isdefault:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "1"
        currencyid: # Duplicate of 'currency'?
          type: string
          example: "1"
        currency_name: # Duplicate of 'name'?
          type: string
          example: "USD"
        total_left_to_pay:
          type: string # Represents decimal
          example: "5.00"
        items:
          type: array
          items:
            $ref: '#/components/schemas/InvoiceItem'
        attachments:
          type: array # Structure unknown
          items:
            type: object
        visible_attachments_to_customer_found:
          type: boolean
          example: false
        client: # Embedded client/customer object
          $ref: '#/components/schemas/Customer'
        payments:
          type: array # Structure unknown, likely Payment objects
          items:
            $ref: '#/components/schemas/Payment'
        scheduled_email: # Structure unknown
          type: object
          nullable: true
        # Fields from search response
        userid: # Customer ID
          type: string
          example: "3"
        company: # Customer Company
          type: string
          example: "xyz"
        # ... other customer fields ...
        invoiceid: # Duplicate of 'id'?
          type: string
          example: "19"
        customfields:
          type: array
          items:
            $ref: '#/components/schemas/CustomFieldItem'

    Lead:
      type: object
      properties:
        # Properties from GET /leads/{id} example
        id:
          type: string # Example shows string
          example: "17"
        hash:
          type: string
          example: "c6e938f8b7a40b1bcfd98dc04f6eeee0-..."
        name:
          type: string
          example: "Lead name"
        contact: # Contact Name?
          type: string
          nullable: true
          example: ""
        title: # Position
          type: string
          nullable: true
          example: ""
        company:
          type: string
          nullable: true
          example: "Themesic Interactive"
        description:
          type: string
          nullable: true
          example: ""
        country:
          type: string # Country ID
          nullable: true
          example: "243"
        zip:
          type: string
          nullable: true
          example: "WC13KJ"
        city:
          type: string
          nullable: true
          example: "London"
        state:
          type: string
          nullable: true
          example: "London"
        address:
          type: string
          nullable: true
          example: "1a The Alexander Suite Silk Point"
        assigned:
          type: string # Staff ID
          example: "5"
        dateadded:
          type: string
          format: date-time
          example: "2019-07-18 08:59:28"
        from_form_id:
          type: string # Example shows string
          example: "0"
        status:
          type: string # Status ID
          example: "0" # Status ID 0? Might be string ID
        source:
          type: string # Source ID
          example: "4"
        lastcontact:
          type: string
          format: date-time
          nullable: true
        dateassigned:
          type: string
          format: date
          nullable: true
        last_status_change:
          type: string
          format: date-time
          nullable: true
        addedfrom: # Staff ID
          type: string
          example: "5" # Example doesn't show but likely exists
        email:
          type: string
          format: email
          nullable: true
        website:
          type: string
          format: uri
          nullable: true
        phonenumber:
          type: string
          nullable: true
        leadorder:
          type: integer # Assuming order is numeric
          nullable: true
        is_public:
          type: string # '0' or '1'
          enum: ["0", "1"]
          nullable: true
        date_converted:
          type: string
          format: date-time
          nullable: true
        lost:
          type: string # '0' or '1'
          enum: ["0", "1"]
          nullable: true
        junk:
          type: string # '0' or '1'
          enum: ["0", "1"]
          nullable: true
        last_lead_status: # Status ID?
          type: string
          nullable: true
        is_imported_from_email_integration:
          type: string # '0' or '1'
          enum: ["0", "1"]
          nullable: true
        email_integration_uid:
          type: string
          nullable: true
        default_language:
          type: string
          nullable: true
        client_id: # Customer ID if converted
          type: string
          nullable: true
        # ... potentially more fields ...
        customfields:
          type: array
          items:
            $ref: '#/components/schemas/CustomFieldItem'

    Milestone:
      type: object
      properties:
        id:
          type: string # Example shows string
          example: "5"
        name:
          type: string
          example: "MIlestone A"
        description:
          type: string
          nullable: true
          example: ""
        description_visible_to_customer:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "0"
        due_date:
          type: string
          format: date
          example: "2019-09-30"
        project_id:
          type: string # Example shows string
          example: "2"
        color:
          type: string
          nullable: true
        milestone_order:
          type: string # Example shows string
          example: "1"
        datecreated:
          type: string
          format: date # Only date in example?
          example: "2019-07-19"
        total_tasks:
          type: string # Example shows string
          example: "0"
        total_finished_tasks:
          type: string # Example shows string
          example: "0"
        customfields:
          type: array
          items:
            $ref: '#/components/schemas/CustomFieldItem'

    PaymentMode:
      type: object
      properties:
        id:
          type: string # Example shows string
          example: "1"
        name:
          type: string
          example: "Bank"
        description:
          type: string
          nullable: true
        show_on_pdf:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "0"
        invoices_only:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "0"
        expenses_only:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "0"
        selected_by_default:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "1"
        active:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "1"

    Payment:
      type: object
      properties:
        # Properties from List response
        id:
          type: string # Example shows string
          example: "3"
        invoiceid:
          type: string # Example shows string
          example: "7"
        amount:
          type: string # Represents decimal
          example: "1000.00"
        paymentmode:
          type: string # Payment Mode ID
          example: "3"
        paymentmethod:
          type: string
          nullable: true
          example: ""
        date:
          type: string
          format: date
          example: "2020-06-08"
        daterecorded:
          type: string
          format: date-time
          example: "2020-06-08 20:29:54"
        note:
          type: string
          nullable: true
          example: ""
        transactionid:
          type: string
          nullable: true
          example: "000355795931"
        # Joined Payment Mode details
        name: # Payment mode name (inconsistent key 'invoiceid' used in example) - assuming 'name'
          type: string
          example: "UPI"
        description: # Payment mode description
          type: string
          nullable: true
          example: ""
        show_on_pdf:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "0"
        invoices_only:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "0"
        expenses_only:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "0"
        selected_by_default:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "0"
        active:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "1"
        paymentid: # Seems like duplicate of 'id'
          type: string
          example: "1"
        customfields:
          type: array
          items:
            $ref: '#/components/schemas/CustomFieldItem'

    Project:
      type: object
      properties:
        id:
          type: string # Example shows string
          example: "28"
        name:
          type: string
          example: "Test1"
        description:
          type: string
          nullable: true
        status:
          type: string # Status ID
          example: "1"
        clientid:
          type: string # Customer/Lead ID
          example: "11"
        billing_type:
          type: string # Billing Type ID
          example: "3"
        start_date:
          type: string
          format: date
          example: "2019-04-19"
        deadline:
          type: string
          format: date
          nullable: true
          example: "2019-08-30"
        project_created: # Renamed from customer_created in example
          type: string
          format: date # Example format unclear, assuming date
          example: "2019-07-16"
        date_finished:
          type: string
          format: date-time # Assuming date-time
          nullable: true
        progress:
          type: string # Example shows string, maybe percentage?
          example: "0"
        progress_from_tasks:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "1"
        project_cost: # Renamed from customer_cost in example
          type: string # Represents decimal
          example: "0.00"
        project_rate_per_hour: # Renamed from customer_rate_per_hour in example
          type: string # Represents decimal
          example: "0.00"
        estimated_hours:
          type: string # Represents decimal
          example: "0.00"
        addedfrom:
          type: string # Staff ID
          example: "5"
        rel_id: # Not in example but might exist
          type: string
        rel_type:
          type: string
          enum: [lead, customer, internal]
          example: "lead" # Corrected from 'customer' in example text which contradicts value
        # ... potentially more fields ...
        customfields:
          type: array
          items:
            $ref: '#/components/schemas/CustomFieldItem'

    ProposalItem: # Structure inferred for POST/PUT
       type: object
       properties:
         description:
           type: string
         long_description:
           type: string
         rate:
           type: number
           format: float
         qty:
           type: integer
         unit:
           type: string
         taxname: # Assuming tax can be specified by name or ID
           type: string
         taxname_2:
           type: string

    Proposal:
      type: object
      properties:
        # Properties from GET /proposals/{id} example
        id:
          type: string # Example shows string
          example: "1"
        subject:
          type: string
          example: "Test Proposal"
        content:
          type: string # HTML content?
          example: "{proposal_items}"
        addedfrom:
          type: string # Staff ID
          example: "1"
        datecreated:
          type: string
          format: date-time
          example: "2021-08-01 13:38:08"
        total:
          type: string # Represents decimal
          example: "10.00"
        subtotal:
          type: string # Represents decimal
          example: "10.00"
        total_tax:
          type: string # Represents decimal
          example: "0.00"
        adjustment:
          type: string # Represents decimal
          example: "0.00"
        discount_percent:
          type: string # Represents decimal
          example: "0.00"
        discount_total:
          type: string # Represents decimal
          example: "0.00"
        discount_type:
          type: string
          nullable: true
          example: ""
        show_quantity_as:
          type: string # Example shows string
          example: "1"
        currency:
          type: string # Currency ID
          example: "1"
        open_till:
          type: string
          format: date
          nullable: true
          example: "2021-08-08"
        date:
          type: string
          format: date
          example: "2021-08-01"
        rel_id:
          type: string # Lead/Customer ID
          example: "1"
        rel_type:
          type: string
          enum: [lead, customer]
          example: "customer"
        assigned:
          type: string # Staff ID
          example: "0" # Can be 0?
        hash:
          type: string
          example: "9fc38e5ad2f8256b1b8430ee41069f75"
        proposal_to:
          type: string # Recipient Name/Company
          example: "test"
        country:
          type: string # Country ID
          nullable: true
          example: "102"
        zip:
          type: string
          nullable: true
          example: "30000202"
        state:
          type: string
          nullable: true
          example: "Test"
        city:
          type: string
          nullable: true
          example: "Test"
        address:
          type: string
          nullable: true
          example: "Test"
        email:
          type: string
          format: email
          example: "test@gmail.com"
        phone:
          type: string
          nullable: true
          example: "01324568903"
        allow_comments:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "1"
        status:
          type: string # Status ID
          example: "6"
        estimate_id:
          type: string # Estimate ID if converted
          nullable: true
        invoice_id:
          type: string # Invoice ID if converted
          nullable: true
        date_converted:
          type: string
          format: date-time
          nullable: true
        pipeline_order:
          type: string # Example shows string
          example: "0"
        is_expiry_notified:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "0"
        acceptance_firstname:
          type: string
          nullable: true
        acceptance_lastname:
          type: string
          nullable: true
        acceptance_email:
          type: string
          format: email
          nullable: true
        acceptance_date:
          type: string
          format: date-time
          nullable: true
        acceptance_ip:
          type: string
          format: ipv4 # or ipv6
          nullable: true
        signature:
          type: string # Path or data?
          nullable: true
        short_link:
          type: string
          format: uri
          nullable: true
        # Currency details
        symbol:
          type: string
          example: "$"
        name: # Currency name
          type: string
          example: "USD"
        decimal_separator:
          type: string
          example: "."
        thousand_separator:
          type: string
          example: ","
        placement:
          type: string
          enum: [before, after]
          example: "before"
        isdefault:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "1"
        currencyid: # Duplicate of 'currency'?
          type: string
          example: "1"
        currency_name: # Duplicate of 'name'?
          type: string
          example: "USD"
        attachments:
          type: array # Structure unknown
          items:
            type: object
        items:
          type: array
          items:
            # Assuming similar structure to InvoiceItem but specific to proposal
            type: object
            properties:
              id:
                type: string
                example: "4"
              rel_id:
                type: string
                example: "1"
              rel_type:
                type: string
                example: "proposal"
              description:
                type: string
                example: "item 1"
              long_description:
                type: string
                nullable: true
                example: "item 1 description"
              qty:
                type: string # Represents decimal
                example: "1.00"
              rate:
                type: string # Represents decimal
                example: "10.00"
              unit:
                type: string
                nullable: true
                example: "1"
              item_order:
                type: string # Example shows string
                example: "1"
        visible_attachments_to_customer_found:
          type: boolean
          example: false
        customfields:
          type: array
          items:
            $ref: '#/components/schemas/CustomFieldItem'

    Staff:
      type: object
      properties:
        staffid:
          type: string # Example shows string
          example: "8"
        email:
          type: string
          format: email
          example: "data1.gsts@gmail.com"
        firstname:
          type: string
          example: "Đào Quang Dân"
        lastname:
          type: string
          nullable: true
          example: ""
        facebook:
          type: string
          format: uri
          nullable: true
          example: ""
        linkedin:
          type: string
          format: uri
          nullable: true
          example: ""
        phonenumber:
          type: string
          nullable: true
          example: ""
        skype:
          type: string
          nullable: true
          example: ""
        password: # Hashed password
          type: string
          example: "$2a$08$ySLokLAM..."
        datecreated:
          type: string
          format: date-time
          example: "2019-02-25 09:11:31"
        profile_image:
          type: string # Filename?
          nullable: true
          example: "8.png"
        last_ip:
          type: string
          format: ipv4 # or ipv6
          nullable: true
        last_login:
          type: string
          format: date-time
          nullable: true
        last_activity:
          type: string
          format: date-time
          nullable: true
        last_password_change:
          type: string
          format: date-time
          nullable: true
        new_pass_key:
          type: string
          nullable: true
        new_pass_key_requested:
          type: string
          format: date-time
          nullable: true
        admin:
          type: string # '0' or '1'
          enum: ["0", "1"]
        role:
          type: string # Role ID?
          nullable: true
        active:
          type: string # '0' or '1'
          enum: ["0", "1"]
        default_language:
          type: string
          nullable: true
        direction:
          type: string
          enum: [ltr, rtl]
          nullable: true
        media_path_slug:
          type: string
          nullable: true
        is_not_staff:
          type: string # '0' or '1'
          enum: ["0", "1"]
        hourly_rate:
          type: string # Represents decimal
          example: "0.00" # Default often 0
        two_factor_auth_enabled:
          type: string # '0' or '1'
          enum: ["0", "1"]
          nullable: true
        two_factor_auth_code:
          type: string
          nullable: true
        two_factor_auth_code_requested:
          type: string
          format: date-time
          nullable: true
        email_signature:
          type: string # HTML?
          nullable: true
        google_auth_secret:
          type: string
          nullable: true
        # ... potentially more fields ...
        customfields:
          type: array
          items:
            $ref: '#/components/schemas/CustomFieldItem'

    Task:
      type: object
      properties:
        id:
          type: string # Example shows string
          example: "10"
        name:
          type: string
          example: "This is a task"
        description:
          type: string # HTML?
          nullable: true
          example: ""
        priority:
          type: string # Priority ID
          example: "2"
        dateadded:
          type: string
          format: date-time
          example: "2019-02-25 12:26:37"
        startdate:
          type: string
          format: date-time # Example includes time
          example: "2019-01-02 00:00:00"
        duedate:
          type: string
          format: date-time # Example includes time
          nullable: true
          example: "2019-01-04 00:00:00"
        datefinished:
          type: string
          format: date-time
          nullable: true
        addedfrom:
          type: string # Staff ID
          example: "9"
        is_added_from_contact:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "0"
        status:
          type: string # Status ID
          example: "4"
        recurring_type:
          type: string
          nullable: true
        repeat_every:
          type: string # Example shows string
          example: "0"
        recurring:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "0"
        is_recurring_from:
          type: string # Task ID?
          nullable: true
        cycles:
          type: string # Example shows string
          example: "0"
        total_cycles:
          type: string # Example shows string
          example: "0"
        custom_recurring:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "0"
        last_recurring_date:
          type: string
          format: date
          nullable: true
        rel_id:
          type: string # Related item ID
          nullable: true
        rel_type:
          type: string
          enum: [lead, customer, invoice, project, quotation, contract, annex, ticket, expense, proposal]
          nullable: true
        is_public:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "0" # Default assumption
        billable:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "1" # Default assumption
        billed:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "0" # Default assumption
        invoice_id:
          type: string # Invoice ID if billed
          example: "0" # Default assumption
        hourly_rate:
          type: string # Represents decimal
          example: "0.00" # Default assumption
        milestone:
          type: string # Milestone ID
          nullable: true
        kanban_order:
          type: string # Example shows string
          example: "0" # Default assumption
        milestone_order:
          type: string # Example shows string
          example: "0" # Default assumption
        visible_to_client:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "0" # Default assumption
        deadline_notified:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "0" # Default assumption
        # ... potentially more fields ...
        customfields:
          type: array
          items:
            $ref: '#/components/schemas/CustomFieldItem'

    Tax:
      type: object
      properties:
        id:
          type: string # Example shows string
          example: "4"
        name:
          type: string
          example: "PAYPAL"
        taxrate:
          type: string # Represents decimal
          example: "5.00"

    Ticket:
      type: object
      properties:
        id: # Added for consistency, might be same as ticketid
          type: string
          example: "7"
        ticketid:
          type: string # Example shows string
          example: "7"
        adminreplying:
          type: string # '0' or '1' ? Staff ID?
          example: "0"
        userid:
          type: string # Customer ID
          example: "0" # Can be 0?
        contactid:
          type: string # Contact ID
          example: "0" # Can be 0?
        email: # Submitter email if not linked
          type: string
          format: email
          nullable: true
        name: # Submitter name if not linked / Also department name in example? Confusing. Assuming department name based on other fields.
          type: string
          example: "Trung bình" # Vietnamese for 'Average' - likely a priority name? This example is confusing. Let's assume 'name' refers to submitter and add department details separately if available.
        department:
          type: string # Department ID
          example: "1"
        priority:
          type: string # Priority ID
          example: "2"
        status:
          type: string # Status ID
          example: "1"
        service:
          type: string # Service ID
          nullable: true
          example: "1"
        ticketkey:
          type: string
          example: "8ef33d61bb0f26cd158d56cc18b71c02"
        subject:
          type: string
          example: "Ticket ER"
        message:
          type: string # HTML?
          example: "Ticket ER"
        admin: # Admin who replied?
          type: string
          nullable: true
          example: "5"
        date: # Date created
          type: string
          format: date-time
          example: "2019-04-10 03:08:21"
        project_id:
          type: string # Project ID
          nullable: true
          example: "5"
        lastreply:
          type: string
          format: date-time
          nullable: true
        clientread:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "0"
        adminread:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "1"
        assigned:
          type: string # Staff ID
          example: "5"
        # ... potentially more fields ...
        customfields:
          type: array
          items:
            $ref: '#/components/schemas/CustomFieldItem'

    ExpenseCategory:
      type: object
      properties:
        id:
          type: string
          example: "1"
        name:
          type: string
          example: "cloud server"
        description:
          type: string
          nullable: true
          example: "AWS server"

    Expense:
      type: object
      properties:
        # Fields from GET /expenses/{id}
        id:
          type: string # Example shows string
          example: "1"
        category:
          type: string # Category ID
          example: "1"
        currency:
          type: string # Currency ID
          example: "1"
        amount:
          type: string # Represents decimal
          example: "50.00"
        tax:
          type: string # Tax ID
          nullable: true
          example: "0"
        tax2:
          type: string # Tax ID 2
          nullable: true
          example: "0"
        reference_no:
          type: string
          nullable: true
          example: "012457893"
        note:
          type: string
          nullable: true
          example: "AWS server hosting charges"
        expense_name:
          type: string
          nullable: true
          example: "Cloud Hosting"
        clientid:
          type: string # Customer ID
          nullable: true
          example: "1"
        project_id:
          type: string # Project ID
          nullable: true
          example: "0"
        billable:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "0"
        invoiceid:
          type: string # Invoice ID if billed
          nullable: true
        paymentmode:
          type: string # Payment Mode ID
          nullable: true
          example: "2"
        date:
          type: string
          format: date
          example: "2021-09-01"
        recurring_type:
          type: string
          nullable: true
          example: "month"
        repeat_every:
          type: string # Example shows string
          nullable: true
          example: "1"
        recurring:
          type: string # '0' or '1' or custom ID?
          nullable: true
          example: "1"
        cycles:
          type: string # Example shows string
          nullable: true
          example: "12"
        total_cycles:
          type: string # Example shows string
          nullable: true
          example: "0"
        custom_recurring:
          type: string # '0' or '1'
          enum: ["0", "1"]
          nullable: true
          example: "0"
        last_recurring_date:
          type: string
          format: date
          nullable: true
        create_invoice_billable:
          type: string # '0' or '1'
          enum: ["0", "1"]
          nullable: true
          example: "0"
        send_invoice_to_customer:
          type: string # '0' or '1'
          enum: ["0", "1"]
          nullable: true
          example: "0"
        recurring_from:
          type: string # Expense ID?
          nullable: true
        dateadded:
          type: string
          format: date-time
          example: "2021-09-01 12:26:34"
        addedfrom:
          type: string # Staff ID
          example: "1"
        is_expense_created_in_xero: # Specific integration field
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "0"
        # Joined Customer details
        userid:
          type: string
          example: "1"
        company:
          type: string
          example: "Company A"
        # ... other customer fields ...
        # Joined Category details
        name: # Category name (duplicate key used in example) - assuming 'category_name'
          type: string
          example: "Hosting Management"
        description: # Category description
          type: string
          example: "server space and other settings"
        # Joined Tax details
        taxrate: # Tax rate 1
          type: string # Represents decimal
          nullable: true
        taxrate2: # Tax rate 2
          type: string # Represents decimal
          nullable: true
        # Joined Payment Mode details
        payment_mode_name: # Payment mode name
          type: string
          example: "Paypal"
        # Consolidated names
        category_name:
          type: string
          example: "Hosting Management"
        tax_name: # Tax name 1
          type: string
          nullable: true
        tax_name2: # Tax name 2
          type: string
          nullable: true
        expenseid: # Duplicate of 'id'?
          type: string
          example: "1"
        customfields:
          type: array
          items:
            $ref: '#/components/schemas/CustomFieldItem'

    EstimateItem: # Structure inferred for POST/PUT
       type: object
       properties:
         description:
           type: string
         long_description:
           type: string
         rate:
           type: number
           format: float
         qty:
           type: integer
         unit:
           type: string
         taxname: # Assuming tax can be specified by name or ID
           type: string
         taxname_2:
           type: string

    Estimate:
      type: object
      properties:
        # Properties from GET /estimates/{id} example
        id:
          type: string # Example shows string
          example: "1"
        sent:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "0"
        datesend:
          type: string
          format: date-time
          nullable: true
        clientid:
          type: string # Example shows string
          example: "1"
        deleted_customer_name:
          type: string
          nullable: true
        project_id:
          type: string # Project ID
          example: "0"
        number:
          type: string # Example shows string
          example: "1"
        prefix:
          type: string
          example: "EST-"
        number_format:
          type: string # Example shows string
          example: "1"
        hash:
          type: string
          example: "b12ae9de6471d0cf153d7846f05128af"
        datecreated:
          type: string
          format: date-time
          example: "2021-07-31 11:06:49"
        date:
          type: string
          format: date
          example: "2021-07-31"
        expirydate:
          type: string
          format: date
          nullable: true
          example: "2021-08-07"
        currency:
          type: string # Currency ID
          example: "1"
        subtotal:
          type: string # Represents decimal
          example: "1200.00"
        total_tax:
          type: string # Represents decimal
          example: "0.00"
        total:
          type: string # Represents decimal
          example: "1200.00"
        adjustment:
          type: string # Represents decimal
          example: "0.00"
        addedfrom:
          type: string # Staff ID
          example: "1"
        status:
          type: string # Status ID
          example: "1"
        clientnote:
          type: string
          nullable: true
          example: ""
        adminnote:
          type: string
          nullable: true
          example: ""
        discount_percent:
          type: string # Represents decimal
          example: "0.00"
        discount_total:
          type: string # Represents decimal
          example: "0.00"
        discount_type:
          type: string
          nullable: true
          example: ""
        invoiceid:
          type: string # Invoice ID if converted
          nullable: true
        invoiced_date:
          type: string
          format: date-time
          nullable: true
        terms:
          type: string
          nullable: true
          example: ""
        reference_no:
          type: string
          nullable: true
          example: ""
        sale_agent:
          type: string # Staff ID
          example: "0"
        billing_street:
          type: string
          nullable: true
          example: "Thangadh, Gujarat, India<br />\r\nShipping"
        billing_city:
          type: string
          nullable: true
          example: "Thangadh"
        billing_state:
          type: string
          nullable: true
          example: "Gujarat"
        billing_zip:
          type: string
          nullable: true
          example: "363630"
        billing_country:
          type: string # Country ID
          example: "102"
        shipping_street:
          type: string
          nullable: true
          example: "Thangadh, Gujarat, India<br />\r\nShipping"
        shipping_city:
          type: string
          nullable: true
          example: "Thangadh"
        shipping_state:
          type: string
          nullable: true
          example: "Gujarat"
        shipping_zip:
          type: string
          nullable: true
          example: "363630"
        shipping_country:
          type: string # Country ID
          example: "102"
        include_shipping:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "1"
        show_shipping_on_estimate:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "1"
        show_quantity_as:
          type: string # Example shows string
          example: "1"
        pipeline_order:
          type: string # Example shows string
          example: "0"
        is_expiry_notified:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "0"
        acceptance_firstname:
          type: string
          nullable: true
        acceptance_lastname:
          type: string
          nullable: true
        acceptance_email:
          type: string
          format: email
          nullable: true
        acceptance_date:
          type: string
          format: date-time
          nullable: true
        acceptance_ip:
          type: string
          format: ipv4 # or ipv6
          nullable: true
        signature:
          type: string # Path or data?
          nullable: true
        short_link:
          type: string
          format: uri
          nullable: true
        # Currency details
        symbol:
          type: string
          example: "$"
        name: # Currency name
          type: string
          example: "USD"
        decimal_separator:
          type: string
          example: "."
        thousand_separator:
          type: string
          example: ","
        placement:
          type: string
          enum: [before, after]
          example: "before"
        isdefault:
          type: string # '0' or '1'
          enum: ["0", "1"]
          example: "1"
        currencyid: # Duplicate of 'currency'?
          type: string
          example: "1"
        currency_name: # Duplicate of 'name'?
          type: string
          example: "USD"
        attachments:
          type: array # Structure unknown
          items:
            type: object
        visible_attachments_to_customer_found:
          type: boolean
          example: false
        items:
          type: array
          items:
            # Assuming similar structure to InvoiceItem but specific to estimate
            type: object
            properties:
              id:
                type: string
                example: "2"
              rel_id:
                type: string
                example: "1"
              rel_type:
                type: string
                example: "estimate"
              description:
                type: string
                example: "test"
              long_description:
                type: string
                nullable: true
                example: "test"
              qty:
                type: string # Represents decimal
                example: "1.00"
              rate:
                type: string # Represents decimal
                example: "1200.00"
              unit:
                type: string
                nullable: true
                example: "1"
              item_order:
                type: string # Example shows string
                example: "1"
        client: # Embedded client/customer object
          $ref: '#/components/schemas/Customer'
        scheduled_email: # Structure unknown
          type: object
          nullable: true
        # Fields from search response
        estimateid: # Duplicate of 'id'?
          type: string
          example: "2"
        customfields:
          type: array
          items:
            $ref: '#/components/schemas/CustomFieldItem'


security:
  - ApiKeyAuth: []

tags:
  - name: Customers
    description: Operations related to customers
  - name: Items
    description: Operations related to invoice/estimate items
  - name: Subscriptions
    description: Operations related to subscriptions
  - name: Timesheets
    description: Operations related to timesheets
  - name: Calendar Events
    description: Operations related to calendar events
  - name: Contacts
    description: Operations related to customer contacts
  - name: Contracts
    description: Operations related to contracts
  - name: Credit Notes
    description: Operations related to credit notes
  - name: Custom Fields
    description: Operations related to custom fields
  - name: Estimates
    description: Operations related to estimates
  - name: Expense Categories
    description: Operations related to expense categories
  - name: Expenses
    description: Operations related to expenses
  - name: Invoices
    description: Operations related to invoices
  - name: Leads
    description: Operations related to leads
  - name: Milestones
    description: Operations related to project milestones
  - name: Payment Modes
    description: Retrieving payment modes
  - name: Payments
    description: Operations related to payments
  - name: Projects
    description: Operations related to projects
  - name: Proposals
    description: Operations related to proposals
  - name: Staff
    description: Operations related to staff members
  - name: Tasks
    description: Operations related to tasks
  - name: Taxes
    description: Retrieving tax information
  - name: Tickets
    description: Operations related to support tickets

paths:
  # Customers
  /customers:
    get:
      tags:
        - Customers
      summary: List all Customers
      description: Retrieve a list of all available customers.
      operationId: listCustomers
      responses:
        '200':
          description: A list of customers.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Customer'
              example:
                # Example from documentation included here
                - stripe_id: null
                  active: '1'
                  vat: '1234567890'
                  address: Test Address
                  billing_country: '0'
                  phonenumber: '1234567890'
                  registration_confirmed: '1'
                  longitude: null
                  billing_city: ''
                  state: Test State
                  shipping_zip: ''
                  billing_zip: ''
                  city: Test City
                  shipping_country: '0'
                  billing_street: ''
                  datecreated: '2019-11-29 12:34:56'
                  company: Jk Technologies
                  shipping_street: ''
                  zip: '123456'
                  billing_state: ''
                  leadid: null
                  addedfrom: '8'
                  userid: '3'
                  default_language: english
                  shipping_state: ''
                  show_primary_contact: '0'
                  country: '102'
                  default_currency: '3'
                  shipping_city: ''
                  latitude: null
                  website: https://example.com
                - website: https://example2.com
                  latitude: null
                  default_currency: '0'
                  shipping_city: London
                  country: '235'
                  show_primary_contact: '0'
                  shipping_state: Greater London
                  default_language: ''
                  addedfrom: '1'
                  userid: '1'
                  leadid: null
                  billing_state: Greater London
                  zip: WC1 ASW
                  shipping_street: 123 Road Street
                  company: Sample Company LTD
                  datecreated: '2019-04-02 13:38:28'
                  billing_street: 123 Road Street
                  shipping_country: '235'
                  city: London
                  billing_zip: WC1 ASW
                  shipping_zip: WC1 ASW
                  longitude: null
                  registration_confirmed: '1'
                  billing_city: London
                  state: Greater London
                  phonenumber: "+44 210 7298299"
                  billing_country: '235'
                  address: 123 Road Street
                  vat: '123456789'
                  active: '1'
                  stripe_id: null
        '404': # Assuming 404 if none found, though example only shows 200
          description: No customers found.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: "No data were found"

    post:
      tags:
        - Customers
      summary: Add New Customer
      description: Create a new customer record.
      operationId: createCustomer
      requestBody:
        description: Customer data to add. Uses multipart/form-data.
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required:
                - company
              properties:
                company:
                  type: string
                  description: Mandatory Customer company.
                vat:
                  type: string
                  description: Optional Vat.
                phonenumber:
                  type: string
                  description: Optional Customer Phone.
                website:
                  type: string
                  format: uri
                  description: Optional Customer Website.
                groups_in:
                  type: array
                  items:
                    type: integer
                  description: Optional Customer groups (Array of group IDs).
                default_language:
                  type: string
                  description: Optional Customer Default Language.
                default_currency:
                  type: integer # Assuming currency ID
                  description: Optional default currency ID.
                address:
                  type: string
                  description: Optional Customer address.
                city:
                  type: string
                  description: Optional Customer City.
                state:
                  type: string
                  description: Optional Customer state.
                zip:
                  type: string
                  description: Optional Zip Code.
                # partnership_type: # Mentioned in docs but not standard CRM field? Optional
                #  type: string
                #  description: Optional Customer partnership type.
                country:
                  type: integer # Assuming country ID
                  description: Optional country ID.
                billing_street:
                  type: string
                  description: Optional Billing Address Street.
                billing_city:
                  type: string
                  description: Optional Billing Address City.
                billing_state:
                  type: string
                  description: Optional Billing Address State.
                billing_zip:
                  type: string
                  description: Optional Billing Address Zip.
                billing_country:
                  type: integer # Assuming country ID
                  description: Optional Billing Address Country ID.
                shipping_street:
                  type: string
                  description: Optional Shipping Address Street.
                shipping_city:
                  type: string
                  description: Optional Shipping Address City.
                shipping_state:
                  type: string
                  description: Optional Shipping Address State.
                shipping_zip:
                  type: string
                  description: Optional Shipping Address Zip.
                shipping_country:
                  type: integer # Assuming country ID
                  description: Optional Shipping Address Country ID.
                custom_fields:
                  type: object
                  description: "Custom fields data. Key format: custom_fields[customers][field_id]. See Custom Fields documentation."
                  additionalProperties: true
      responses:
        '200': # Documentation shows 200 OK for successful add
          description: Customer added successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse'
              example:
                status: true
                message: Customer add successful.
        '400': # Assuming 400 for validation errors or failure
          description: Customer add failed (e.g., missing required fields).
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: Customer add fail.

  /customers/{id}:
    get:
      tags:
        - Customers
      summary: Request Customer Information
      description: Retrieve information for a specific customer by their ID.
      operationId: getCustomerById
      parameters:
        - name: id
          in: path
          required: true
          description: Customer unique ID.
          schema:
            type: integer # Assuming ID is numeric
            format: int64
      responses:
        '200':
          description: Customer information retrieved successfully.
          content:
            application/json:
              schema:
                # Response schema seems inconsistent (Project fields?), using Customer schema
                $ref: '#/components/schemas/Customer'
              # Example provided seems to be for a Project, not Customer. Using generic Customer structure.
        '404':
          description: Customer not found.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: No data were found

    put:
      tags:
        - Customers
      summary: Update a Customer
      description: Update an existing customer's information.
      operationId: updateCustomer
      parameters:
        - name: id
          in: path
          required: true
          description: Customer unique ID to update.
          schema:
            type: integer # Assuming ID is numeric
            format: int64
      requestBody:
        description: Customer data to update. Uses multipart/form-data.
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required:
                - company # Still mandatory for update? Assume yes.
              properties:
                # Properties same as POST, but none are explicitly mandatory except 'company' maybe
                company:
                  type: string
                  description: Mandatory Customer company.
                vat:
                  type: string
                  description: Optional Vat.
                phonenumber:
                  type: string
                  description: Optional Customer Phone.
                website:
                  type: string
                  format: uri
                  description: Optional Customer Website.
                groups_in:
                  type: array
                  items:
                    type: integer
                  description: Optional Customer groups (Array of group IDs).
                default_language:
                  type: string
                  description: Optional Customer Default Language.
                default_currency:
                  type: integer # Assuming currency ID
                  description: Optional default currency ID.
                address:
                  type: string
                  description: Optional Customer address.
                city:
                  type: string
                  description: Optional Customer City.
                state:
                  type: string
                  description: Optional Customer state.
                zip:
                  type: string
                  description: Optional Zip Code.
                country:
                  type: integer # Assuming country ID
                  description: Optional country ID.
                billing_street:
                  type: string
                  description: Optional Billing Address Street.
                billing_city:
                  type: string
                  description: Optional Billing Address City.
                billing_state:
                  type: string # Doc says Number, but State is usually string? Using string.
                  description: Optional Billing Address State.
                billing_zip:
                  type: string
                  description: Optional Billing Address Zip.
                billing_country:
                  type: integer # Assuming country ID
                  description: Optional Billing Address Country ID.
                shipping_street:
                  type: string
                  description: Optional Shipping Address Street.
                shipping_city:
                  type: string
                  description: Optional Shipping Address City.
                shipping_state:
                  type: string
                  description: Optional Shipping Address State.
                shipping_zip:
                  type: string
                  description: Optional Shipping Address Zip.
                shipping_country:
                  type: integer # Assuming country ID
                  description: Optional Shipping Address Country ID.
                custom_fields:
                  type: object
                  description: "Custom fields data. Key format: custom_fields[customers][field_id]. See Custom Fields documentation."
                  additionalProperties: true
      responses:
        '200':
          description: Customer updated successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse'
              example:
                status: true
                message: Customer Update Successful.
        '400': # Assuming 400 for general update failure / validation
          description: Customer update failed.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: Customer Update Fail.
        '404':
          description: Customer not found.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'

  /customers/search/{keysearch}:
    get:
      tags:
        - Customers
      summary: Search Customer Information
      description: Search for customers based on keywords.
      operationId: searchCustomers
      parameters:
        - name: keysearch
          in: path
          required: true
          description: Search Keywords.
          schema:
            type: string
      responses:
        '200':
          description: Search results matching the keywords.
          content:
            application/json:
              schema:
                type: array
                items:
                  # Response schema seems inconsistent (Project fields?), using Customer schema
                  $ref: '#/components/schemas/Customer'
              # Example provided seems to be for a Project, not Customer. Using generic Customer structure.
        '404':
          description: No customers found matching the search criteria.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: No data were found

  # Non-standard DELETE path from documentation
  /delete/customers/{id}:
    delete:
      tags:
        - Customers
      summary: Delete a Customer
      description: Delete a specific customer by their ID. (Note: Non-standard path)
      operationId: deleteCustomer
      parameters:
        - name: id
          in: path
          required: true
          description: Customer unique ID to delete.
          schema:
            type: integer # Assuming ID is numeric
            format: int64
      responses:
        '200':
          description: Customer deleted successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse' # Doc uses 'status: string' ? Assuming boolean like others
              example:
                status: true # Changed from string "true"
                message: Customer Delete Successful.
        '404':
          description: Customer not found or delete failed.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: Customer Delete Fail.

  # Items
  /items/{id}:
    get:
      tags:
        - Items
      summary: Request Invoice Item's Information
      description: Retrieve information for a specific invoice/estimate item by its ID.
      operationId: getItemById
      parameters:
        - name: id
          in: path
          required: true
          description: Item unique ID.
          schema:
            type: integer # Assuming numeric ID
            format: int64
      responses:
        '200':
          description: Item information retrieved successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Item'
              example:
                itemid: "1"
                rate: "100.00"
                taxrate: "5.00"
                taxid: "1"
                taxname: PAYPAL
                taxrate_2: "9.00"
                taxid_2: "2"
                taxname_2: CGST
                description: JBL Soundbar
                long_description: The JBL Cinema SB110 is a hassle-free soundbar
                group_id: "0"
                group_name: null
                unit: ""
        '404':
          description: Item not found.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: No data were found

  /items/search/{keysearch}:
    get:
      tags:
        - Items
      summary: Search Invoice Item's Information
      description: Search for items based on keywords. Used typically for adding items to invoices/estimates.
      operationId: searchItems
      parameters:
        - name: keysearch
          in: path
          required: true
          description: Search Keywords.
          schema:
            type: string
      responses:
        '200':
          description: Search results matching the keywords. Returns simplified item info for selection.
          content:
            application/json:
              schema:
                # Response is different from GET /items/{id}
                type: object
                properties:
                  rate:
                    type: string # Represents decimal
                    example: "100.00"
                  id:
                    type: string
                    example: "1"
                  name:
                    type: string
                    example: "(100.00) JBL Soundbar"
                  subtext:
                    type: string
                    example: "The JBL Cinema SB110 is a hassle-free soundbar..."
              example:
                  rate: "100.00"
                  id: "1"
                  name: "(100.00) JBL Soundbar"
                  subtext: "The JBL Cinema SB110 is a hassle-free soundbar..."
        '404':
          description: No items found matching the search criteria.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: No data were found

  # Subscriptions
  /subscriptions:
    get:
      tags:
        - Subscriptions
      summary: Request all Subscriptions
      description: Retrieve a list of all subscriptions.
      operationId: listSubscriptions
      responses:
        '200':
          description: A list of subscriptions.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Subscription'
              example: # Example from documentation
                - name: 'New  subscription'
                  description: 'This is a detailed description of subscription'
                  description_in_item: 1
                  clientid: 123
                  date: '2024-01-31'
                  terms: 'subscription payment is due'
                  currency: 4
                  tax_id: 456
                  stripe_tax_id_2: 'tax-789'
                  stripe_plan_id: 'subscription_ABC'
                  tax_id_2: 12
                  stripe_subscription_id: 'sub_123456789'
                  next_billing_cycle: 1643808000
                  ends_at: 1646486400
                  status: 'active'
                  quantity: 5
                  project_id: 789
                  hash: 'a1b2c3'
                  created: '2024-01-31 12:34:56'
                  created_from: 1
                  date_subscribed: '2024-01-31 10:00:00'
                  in_test_environment: 1
                  last_sent_at: '2024-01-31 14:45:00'
        '404':
          description: No subscriptions found.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: No data were found
    post:
      tags:
        - Subscriptions
      summary: Add New Subscription
      description: Create a new subscription record.
      operationId: createSubscription
      requestBody:
        description: Subscription data to add. Uses multipart/form-data.
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required: # Guessing required fields based on common practice
                - name
                - clientid
                - currency
                - quantity
              properties:
                name:
                  type: string
                  description: New subscription name.
                description:
                  type: string # Type 'Text' in docs
                  description: Detailed description of the subscription.
                description_in_item:
                  type: integer # Type 'TinyInt' in docs (0 or 1)
                  description: Indicates if the description is included in the item (1 or 0).
                  enum: [0, 1]
                clientid:
                  type: integer # Type 'Int'
                  description: Client ID.
                date:
                  type: string
                  format: date # Type 'Date'
                  description: Subscription start date (YYYY-MM-DD).
                terms:
                  type: string # Type 'Text'
                  description: Subscription terms.
                currency:
                  type: integer # Type 'Int'
                  description: Currency ID.
                tax_id:
                  type: integer # Type 'Int'
                  description: Tax ID.
                stripe_tax_id_2:
                  type: string # Type 'Varchar'
                  description: Stripe tax ID.
                stripe_plan_id:
                  type: string # Type 'Text'
                  description: Stripe plan ID.
                tax_id_2:
                  type: integer # Type 'Int'
                  description: Second tax ID.
                stripe_subscription_id:
                  type: string # Type 'Varchar'
                  description: Stripe subscription ID.
                next_billing_cycle:
                  type: integer # Type 'BigInt' (Unix timestamp)
                  format: int64
                  description: Next billing cycle timestamp.
                ends_at:
                  type: integer # Type 'BigInt' (Unix timestamp)
                  format: int64
                  description: Subscription end timestamp.
                status:
                  type: string # Type 'Varchar'
                  description: Subscription status (e.g., active).
                quantity:
                  type: integer # Type 'Int'
                  description: Subscription quantity.
                project_id:
                  type: integer # Type 'Int'
                  description: Associated project ID.
                hash:
                  type: string # Type 'Varchar'
                  description: Unique hash identifier.
                created:
                  type: string
                  format: date-time # Type 'DateTime'
                  description: Creation timestamp (YYYY-MM-DD HH:MM:SS). Read-only? Usually set by server.
                created_from:
                  type: integer # Type 'Int'
                  description: ID of the creator. Read-only? Usually set by server/auth user.
                date_subscribed:
                  type: string
                  format: date-time # Type 'DateTime'
                  description: Subscription date (YYYY-MM-DD HH:MM:SS). Read-only? Usually set by server.
                in_test_environment:
                  type: integer # Type 'Int' (0 or 1)
                  description: Indicates if the subscription is in a test environment (1 or 0).
                  enum: [0, 1]
                last_sent_at:
                  type: string
                  format: date-time # Type 'DateTime'
                  description: Last sent timestamp (YYYY-MM-DD HH:MM:SS). Read-only?
                custom_fields:
                  type: object
                  description: "Custom fields data. Key format: custom_fields[subscriptions][field_id]. See Custom Fields documentation."
                  additionalProperties: true
      responses:
        '200': # Doc shows 200 OK for success
          description: Subscription added successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse'
              example:
                status: true
                message: Data Added Successfully
        '400': # Doc shows 400 Bad Request for failure
          description: Data could not be added (e.g., validation error).
          content:
            application/json:
              schema:
                type: object # Specific error format from docs
                properties:
                  status:
                    type: boolean
                    example: false
                  error:
                    type: string
                    example: Data not Added
              example:
                status: false
                error: Data not Added

  /subscriptions/{id}:
    get:
      tags:
        - Subscriptions
      summary: Request Subscription Information
      description: Retrieve information for a specific subscription by its ID.
      operationId: getSubscriptionById
      parameters:
        - name: id
          in: path
          required: true
          description: Subscription unique ID.
          schema:
            type: integer # Assuming numeric ID based on param name 'id'
            format: int64
      responses:
        '200':
          description: Subscription information retrieved successfully.
          content:
            application/json:
              schema:
                # Response is array with one object in docs? Assuming single object normally.
                $ref: '#/components/schemas/Subscription'
              example: # Single object from the array example in docs
                 name: 'New  subscription'
                 description: 'This is a detailed description of subscription'
                 description_in_item: 1
                 clientid: 123
                 date: '2024-01-31'
                 terms: 'subscription payment is due'
                 currency: 4
                 tax_id: 456
                 stripe_tax_id_2: 'tax-789'
                 stripe_plan_id: 'subscription_ABC'
                 tax_id_2: 12
                 stripe_subscription_id: 'sub_123456789'
                 next_billing_cycle: 1643808000
                 ends_at: 1646486400
                 status: 'active'
                 quantity: 5
                 project_id: 789
                 hash: 'a1b2c3'
                 created: '2024-01-31 12:34:56'
                 created_from: 1
                 date_subscribed: '2024-01-31 10:00:00'
                 in_test_environment: 1
                 last_sent_at: '2024-01-31 14:45:00'
        '404':
          description: Subscription not found.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: No data were found

    put:
      tags:
        - Subscriptions
      summary: Update a Subscription
      description: Update an existing subscription's information. Request body parameters are not specified, assuming similar to POST but optional.
      operationId: updateSubscription
      parameters:
        - name: id
          in: path
          required: true
          description: Subscription unique ID to update.
          schema:
            type: integer # Assuming numeric ID
            format: int64
      requestBody:
        description: Subscription data to update. Uses multipart/form-data. Fields are likely optional.
        required: true # Body required, but fields inside optional
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                # Assume same properties as POST, but optional
                name:
                  type: string
                description:
                  type: string
                description_in_item:
                  type: integer
                  enum: [0, 1]
                clientid:
                  type: integer
                date:
                  type: string
                  format: date
                terms:
                  type: string
                currency:
                  type: integer
                tax_id:
                  type: integer
                stripe_tax_id_2:
                  type: string
                stripe_plan_id:
                  type: string
                tax_id_2:
                  type: integer
                stripe_subscription_id:
                  type: string
                next_billing_cycle:
                  type: integer
                  format: int64
                ends_at:
                  type: integer
                  format: int64
                status:
                  type: string
                quantity:
                  type: integer
                project_id:
                  type: integer
                hash:
                  type: string
                # Read-only fields likely ignored: created, created_from, date_subscribed, last_sent_at
                in_test_environment:
                  type: integer
                  enum: [0, 1]
                custom_fields:
                  type: object
                  description: "Custom fields data. Key format: custom_fields[subscriptions][field_id]. See Custom Fields documentation."
                  additionalProperties: true
      responses:
        '200':
          description: Subscription updated successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse'
              example:
                status: true
                message: Data Update Successful.
        '400': # Docs show 404 but 400 seems more appropriate for "Not Acceptable OR Not Provided"
          description: Data not acceptable or not provided.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: Data Not Acceptable OR Not Provided
        '404': # For resource not found or general update fail
          description: Subscription not found or update failed.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                 status: false
                 message: Data Update Fail. # Or "No data were found" if ID invalid

    delete:
      tags:
        - Subscriptions
      summary: Delete a Subscription
      description: Delete a specific subscription by its ID.
      operationId: deleteSubscription
      parameters:
        - name: id
          in: path
          required: true
          description: Subscription unique ID to delete.
          schema:
            type: integer # Assuming numeric ID
            format: int64
      responses:
        '200':
          description: Subscription deleted successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse'
              example:
                status: true
                message: Delete Successful.
        '404':
          description: Subscription not found or delete failed.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: Delete Fail.

  # Timesheets
  /timesheets:
    get:
      tags:
        - Timesheets
      summary: Request all Timesheets
      description: Retrieve a list of all timesheets.
      operationId: listTimesheets
      responses:
        '200':
          description: A list of timesheets.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Timesheet'
              example: # Example from documentation
                - task_id: "2"
                  start_time: "10:00:00"
                  end_time: "12:00:00"
                  staff_id: "2" # Corrected key name
                  hourly_rate: "5.00"
                  note: "testing note"
        '404':
          description: No timesheets found.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: No data were found
    post:
      tags:
        - Timesheets
      summary: Add New Timesheet
      description: Create a new timesheet record. Parameters are not specified in the documentation.
      operationId: createTimesheet
      requestBody:
        description: Timesheet data to add. Uses multipart/form-data. Fields need to be inferred or found elsewhere.
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required: # Guessing required fields
                - task_id
                - start_time
                - staff_id
              properties:
                task_id:
                  type: integer
                  description: ID of the related task.
                staff_id:
                  type: integer
                  description: ID of the staff member.
                start_time:
                  type: string
                  format: date-time # Or just time 'HH:MM:SS'? Docs example only shows time, but often needs date too. Assuming date-time.
                  description: Start time of the timesheet entry (e.g., YYYY-MM-DD HH:MM:SS).
                end_time:
                  type: string
                  format: date-time # Or just time 'HH:MM:SS'?
                  description: End time of the timesheet entry (e.g., YYYY-MM-DD HH:MM:SS). Optional if timer is running.
                note:
                  type: string
                  description: Optional note for the timesheet entry.
                hourly_rate: # Not usually sent on create, derived from task/project/staff? Assuming optional if override needed.
                  type: number
                  format: float
                  description: Hourly rate for this specific entry (optional override).
                custom_fields:
                  type: object
                  description: "Custom fields data. Key format: custom_fields[timesheets][field_id]. See Custom Fields documentation."
                  additionalProperties: true
      responses:
        '200': # Doc shows 200 OK for success
          description: Timesheet added successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse'
              example:
                status: true
                message: Data Added Successfully
        '400': # Doc shows 404 but 400 is better for "Data not Added"
          description: Data could not be added (e.g., validation error).
          content:
            application/json:
              schema:
                type: object # Specific error format from docs
                properties:
                  status:
                    type: boolean
                    example: false
                  error:
                    type: string
                    example: Data not Added
              example:
                status: false
                error: Data not Added

  /timesheets/{id}:
    get:
      tags:
        - Timesheets
      summary: Request Timesheet Information
      description: Retrieve information for a specific timesheet by its ID.
      operationId: getTimesheetById
      parameters:
        - name: id
          in: path
          required: true
          description: Timesheet unique ID.
          schema:
            type: integer
            format: int64
      responses:
        '200':
          description: Timesheet information retrieved successfully.
          content:
            application/json:
              schema:
                # Response is array with one object in docs? Assuming single object normally.
                $ref: '#/components/schemas/Timesheet'
              example: # Single object from the array example in docs
                  task_id: "2"
                  start_time: "10:00:00"
                  end_time: "12:00:00"
                  staff_id: "2" # Corrected key name
                  hourly_rate: "5.00"
                  note: "testing note"
        '404':
          description: Timesheet not found.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: No data were found

    put:
      tags:
        - Timesheets
      summary: Update a Timesheet
      description: Update an existing timesheet's information. Parameters are not specified.
      operationId: updateTimesheet
      parameters:
        - name: id
          in: path
          required: true
          description: Timesheet unique ID to update.
          schema:
            type: integer
            format: int64
      requestBody:
        description: Timesheet data to update. Uses multipart/form-data. Fields are likely optional.
        required: true # Body required, but fields inside optional
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                  # Assume same properties as POST, but optional
                  task_id:
                    type: integer
                  staff_id:
                    type: integer
                  start_time:
                    type: string
                    format: date-time
                  end_time:
                    type: string
                    format: date-time
                  note:
                    type: string
                  hourly_rate:
                    type: number
                    format: float
                  custom_fields:
                    type: object
                    description: "Custom fields data. Key format: custom_fields[timesheets][field_id]. See Custom Fields documentation."
                    additionalProperties: true
      responses:
        '200':
          description: Timesheet updated successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse'
              example:
                status: true
                message: Data Update Successful.
        '400': # Docs show 404 but 400 seems more appropriate for "Not Acceptable OR Not Provided"
          description: Data not acceptable or not provided.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: Data Not Acceptable OR Not Provided
        '404': # For resource not found or general update fail
          description: Timesheet not found or update failed.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                 status: false
                 message: Data Update Fail.

    delete:
      tags:
        - Timesheets
      summary: Delete a Timesheet
      description: Delete a specific timesheet by its ID.
      operationId: deleteTimesheet
      parameters:
        - name: id
          in: path
          required: true
          description: Timesheet unique ID to delete.
          schema:
            type: integer
            format: int64
      responses:
        '200':
          description: Timesheet deleted successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse'
              example:
                status: true
                message: Delete Successful.
        '404':
          description: Timesheet not found or delete failed.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: Delete Fail.

  # Calendar Events
  /calendar:
    get:
      tags:
        - Calendar Events
      summary: Get All Calendar Events
      description: Retrieve a list of all calendar events accessible to the token holder.
      operationId: listCalendarEvents
      responses:
        '200':
          description: A list of calendar events.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/CalendarEvent'
              example: # Example from documentation
                - eventid: "1"
                  title: "Hello"
                  description: "test"
                  userid: "1"
                  start: "2023-12-12 07:00:00"
                  end: "2023-12-12 07:00:00" # Corrected format from example
                  public: "1"
                  color: "#03a9f4"
                  isstartnotified: "0"
                  reminder_before: "30"
                  reminder_before_type: "minutes"
                - eventid: "2"
                  title: "Hello2"
                  description: "test2"
                  userid: "2"
                  start: "2022-12-12 07:00:00"
                  end: "2022-12-12 07:00:00" # Corrected format from example
                  public: "0"
                  color: "#03a9f4"
                  isstartnotified: "0"
                  reminder_before: "3"
                  reminder_before_type: "hours"
        '404':
          description: No calendar events found.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: No data were found
    post:
      tags:
        - Calendar Events
      summary: Create a new Calendar Event
      description: Add a new event to the calendar.
      operationId: createCalendarEvent
      requestBody:
        description: Calendar event data to add. Uses multipart/form-data.
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required:
                - title
                - start
                - reminder_before_type
                - reminder_before
                - userid
                - isstartnotified
                - public
              properties:
                title:
                  type: string
                  description: Required event title.
                description:
                  type: string
                  description: Optional event description.
                start:
                  type: string
                  format: date-time # Doc says Date, but format likely date-time
                  description: Required event start date/time (YYYY-MM-DD HH:MM:SS).
                end: # Not listed as parameter but present in GET, likely optional
                  type: string
                  format: date-time
                  description: Optional event end date/time (YYYY-MM-DD HH:MM:SS).
                reminder_before_type:
                  type: string
                  description: Required value of reminder before type (e.g., 'minutes', 'hours', 'days').
                  enum: [minutes, hours, days, weeks] # Assuming common options
                reminder_before:
                  type: integer # Doc says Number
                  description: Required value of reminder before (numeric value).
                color:
                  type: string
                  description: Optional event color (hex code, e.g., #03a9f4).
                userid:
                  type: integer # Doc says Number, User ID creating/owning the event?
                  description: Required user ID associated with the event.
                isstartnotified:
                  type: integer # Doc says Number (0 or 1)
                  description: Required isstartnotified status (0 or 1).
                  enum: [0, 1]
                public:
                  type: integer # Doc says Number (0 or 1)
                  description: Required public status (0 for private, 1 for public).
                  enum: [0, 1]
                custom_fields:
                  type: object
                  description: "Custom fields data. Key format: custom_fields[events][field_id]. See Custom Fields documentation."
                  additionalProperties: true
      responses:
        '200': # Doc shows 200 OK for success
          description: Calendar event added successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse'
              example:
                status: true
                message: Data Added Successfully
        '400': # Doc shows 404 but 400 is better for "Data Creation Failed"
          description: Data creation failed (e.g., validation error).
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: Data Creation Failed

  /calendar/{id}:
    get:
      tags:
        - Calendar Events
      summary: Request Specific Event Information
      description: Retrieve information for a specific calendar event by its ID.
      operationId: getCalendarEventById
      parameters:
        - name: id
          in: path
          required: true
          description: Event unique ID.
          schema:
            type: integer # Assuming numeric ID
            format: int64
      responses:
        '200':
          description: Calendar event information retrieved successfully.
          content:
            application/json:
              schema:
                # Response is array with one object in docs? Assuming single object normally.
                $ref: '#/components/schemas/CalendarEvent'
              example: # Single object from the array example in docs
                eventid: "1"
                title: "Hello"
                description: "test"
                userid: "1"
                start: "2023-12-12 07:00:00"
                end: "2023-12-12 07:00:00" # Corrected format from example
                public: "1"
                color: "#03a9f4"
                isstartnotified: "0"
                reminder_before: "30"
                reminder_before_type: "minutes"
        '404':
          description: Calendar event not found.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: No data were found

    put:
      tags:
        - Calendar Events
      summary: Update a Calendar Event
      description: Update an existing calendar event's information.
      operationId: updateCalendarEvent
      parameters:
        - name: id # Doc param name is 'unique', but path is ':id'. Using 'id'.
          in: path
          required: true
          description: Calendar event unique ID to update.
          schema:
            type: integer # Assuming numeric ID
            format: int64
      requestBody:
        description: Calendar event data to update. Uses multipart/form-data. Fields are likely optional.
        required: true # Body required, but fields inside optional
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                  # Assume same properties as POST, but optional
                  title:
                    type: string
                  description:
                    type: string
                  start:
                    type: string
                    format: date-time
                  end:
                    type: string
                    format: date-time
                  reminder_before_type:
                    type: string
                    enum: [minutes, hours, days, weeks]
                  reminder_before:
                    type: integer
                  color:
                    type: string
                  userid:
                    type: integer
                  isstartnotified:
                    type: integer
                    enum: [0, 1]
                  public:
                    type: integer
                    enum: [0, 1]
                  custom_fields:
                    type: object
                    description: "Custom fields data. Key format: custom_fields[events][field_id]. See Custom Fields documentation."
                    additionalProperties: true
      responses:
        '200':
          description: Calendar event updated successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse'
              example:
                status: true
                message: Data Update Successful.
        '400': # Docs show 404 but 400 seems more appropriate for general failure
          description: Calendar event update failed.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                 status: false
                 message: Data Update Fail
        '404': # For resource not found
          description: Calendar event not found.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'

    delete:
      tags:
        - Calendar Events
      summary: Delete a Calendar Event
      description: Delete a specific calendar event by its ID.
      operationId: deleteCalendarEvent
      parameters:
        - name: id # Docs say 'ID' type Number, path uses ':id'.
          in: path
          required: true
          description: Calendar event unique ID to delete.
          schema:
            type: integer # Assuming numeric ID
            format: int64
      responses:
        '200':
          description: Calendar event deleted successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse'
              example:
                status: true
                message: Data Deleted Successfully
        '404':
          description: Calendar event not found or delete failed.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: Data Delete Fail

  # Contacts
  /contacts:
    post:
      tags:
        - Contacts
      summary: Add New Contact
      description: Create a new contact for a customer.
      operationId: createContact
      requestBody:
        description: Contact data to add. Uses multipart/form-data.
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required:
                - customer_id
                - firstname
                - lastname
                - email
              properties:
                customer_id:
                  type: integer # Doc says Number
                  description: Mandatory Customer ID.
                firstname:
                  type: string
                  description: Mandatory First Name.
                lastname:
                  type: string
                  description: Mandatory Last Name.
                email:
                  type: string
                  format: email
                  description: Mandatory E-mail.
                title:
                  type: string
                  description: Optional Position.
                phonenumber:
                  type: string
                  description: Optional Phone Number.
                direction:
                  type: string
                  description: Optional Direction (rtl or ltr). Default value ltr (assuming typo in doc 'rtl').
                  enum: [ltr, rtl]
                  default: ltr
                password:
                  type: string
                  format: password
                  description: Optional password (only required if send_set_password_email is passed).
                is_primary:
                  type: string # Doc says 'set on or don't pass it' -> means value 'on'? Using boolean might be better but follow doc.
                  description: Optional Primary Contact (set to 'on' to make primary).
                  enum: ["on"]
                donotsendwelcomeemail:
                  type: string # 'set on or don't pass it'
                  description: Optional Do Not Send Welcome Email (set to 'on' to prevent).
                  enum: ["on"]
                send_set_password_email:
                  type: string # 'set on or don't pass it'
                  description: Optional Send Set Password Email (set to 'on' to send).
                  enum: ["on"]
                permissions:
                  type: array
                  items:
                    type: string # Permissions IDs as strings: "1", "2", etc.
                  description: |
                    Optional Permissions for this contact.
                    - "1": Invoices
                    - "2": Estimates
                    - "3": Contracts
                    - "4": Proposals
                    - "5": Support
                    - "6": Projects
                  example: ["1", "5"]
                invoice_emails:
                  type: string # 'set value same as name or don't pass it' -> value 'invoice_emails'?
                  description: Optional E-Mail Notification for Invoices (set value 'invoice_emails').
                  enum: [invoice_emails]
                estimate_emails:
                  type: string
                  description: Optional E-Mail Notification for Estimate (set value 'estimate_emails').
                  enum: [estimate_emails]
                credit_note_emails:
                  type: string
                  description: Optional E-Mail Notification for Credit Note (set value 'credit_note_emails').
                  enum: [credit_note_emails]
                project_emails:
                  type: string
                  description: Optional E-Mail Notification for Project (set value 'project_emails').
                  enum: [project_emails]
                ticket_emails:
                  type: string
                  description: Optional E-Mail Notification for Tickets (set value 'ticket_emails').
                  enum: [ticket_emails]
                task_emails:
                  type: string
                  description: Optional E-Mail Notification for Task (set value 'task_emails').
                  enum: [task_emails]
                contract_emails:
                  type: string
                  description: Optional E-Mail Notification for Contract (set value 'contract_emails').
                  enum: [contract_emails]
                custom_fields:
                  type: object
                  description: "Custom fields data. Key format: custom_fields[contacts][field_id]. See Custom Fields documentation."
                  additionalProperties: true
      responses:
        '200': # Doc shows 200 OK for success
          description: Contact added successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse'
              example:
                status: true
                message: Contact added successfully
        '400': # Doc shows 404 but 400 is better for general 'add fail'
          description: Contact add failed (e.g., validation error).
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: Contact add fail
        '409': # Conflict for existing email
          description: Email already exists for another contact.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseDetailed' # Assuming detailed error structure for specific field conflict
              example:
                status: false
                error: {"email":"This Email is already exists"}
                message: "This Email is already exists"

  # Path combines listing all for a customer and getting a specific one
  /contacts/{customer_id}/{contact_id}:
    get:
      tags:
        - Contacts
      summary: List Contacts or Get Specific Contact
      description: |
        Retrieve contact information.
        - If `contact_id` is provided, retrieves a specific contact.
        - If `contact_id` is *not* provided (or set to 0, behavior may vary), lists all contacts for the given `customer_id`.
        *Note: Combining list and get in one path is unusual. Standard REST might use `/contacts?customer_id={customer_id}` for list and `/contacts/{contact_id}` for get.*
      operationId: getCustomerContacts
      parameters:
        - name: customer_id
          in: path
          required: true
          description: Mandatory Customer unique ID.
          schema:
            type: integer
            format: int64
        - name: contact_id
          in: path
          required: true # Technically required by path, but doc says Optional logic applies
          description: Contact unique ID. If omitted or 0 (check API behavior), lists all contacts for the customer.
          schema:
            type: integer
            format: int64
      responses:
        '200':
          description: Contact information retrieved successfully. Can be a single Contact object or an array of Contact objects.
          content:
            application/json:
              schema:
                oneOf: # Response can be one or many
                  - $ref: '#/components/schemas/Contact' # Single contact
                  - type: array # List of contacts
                    items:
                      $ref: '#/components/schemas/Contact'
              examples:
                singleContact: # Example when specific contact_id is provided
                  value:
                    id: "6"
                    userid: "1"
                    company: "xyz"
                    vat: ""
                    phonenumber: "1234567890"
                    country: "0"
                    city: ""
                    zip: "360005"
                    state: ""
                    address: ""
                    website: ""
                    datecreated: "2020-08-19 20:07:49"
                    active: "1"
                    leadid: null
                    billing_street: ""
                    billing_city: ""
                    billing_state: ""
                    billing_zip: ""
                    billing_country: "0"
                    shipping_street: ""
                    shipping_city: ""
                    shipping_state: ""
                    shipping_zip: ""
                    shipping_country: "0"
                    longitude: null
                    latitude: null
                    default_language: "english"
                    default_currency: "0"
                    show_primary_contact: "0"
                    stripe_id: null
                    registration_confirmed: "1"
                    addedfrom: "1"
        '404':
          description: No contact(s) found for the specified criteria.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: No data were found

  # Non-standard DELETE path from documentation
  /delete/contacts/{id}:
    delete:
      tags:
        - Contacts
      summary: Delete Contact
      description: Delete a specific contact by their ID. (Note: Non-standard path. Doc param description says 'customer_id' but path is ':id', assuming contact ID)
      operationId: deleteContact
      parameters:
        - name: id # Assuming contact ID based on path
          in: path
          required: true
          description: Contact unique ID to delete.
          schema:
            type: integer
            format: int64
        # customer_id: # Doc parameter table mentions customer_id, but it's not in path. Is it needed as query/body? Unclear. Omitting based on path.
        #  in: query # Guessing location
        #  required: true # Doc says 'unique Customer id' - implies required?
        #  description: Mandatory Customer unique ID to which the contact belongs.
        #  schema:
        #    type: integer
        #    format: int64
      responses:
        '200':
          description: Contact deleted successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse'
              example:
                status: true
                message: Contact Deleted Successfully
        '404':
          description: Contact not found or delete failed.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: Contact Delete Fail

  /contacts/{id}: # Assuming standard PUT path, doc parameter description matches POST/PUT fields for Contact
    put:
      tags:
        - Contacts
      summary: Update Contact Information
      description: Update an existing contact's information.
      operationId: updateContact
      parameters:
        - name: id
          in: path
          required: true
          description: Mandatory Contact ID to update.
          schema:
            type: integer
            format: int64
      requestBody:
        description: Contact data to update. Uses multipart/form-data.
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required: # Assuming these remain mandatory for update
                - firstname
                - lastname
                - email
              properties:
                # Same properties as POST, but optional unless marked required above
                # customer_id: # Not usually updatable, but might be needed for permission checks? Omitting from body.
                firstname:
                  type: string
                  description: Mandatory First Name.
                lastname:
                  type: string
                  description: Mandatory Last Name.
                email:
                  type: string
                  format: email
                  description: Mandatory E-mail.
                title:
                  type: string
                  description: Optional Position.
                phonenumber:
                  type: string
                  description: Optional Phone Number.
                direction:
                  type: string
                  description: Optional Direction (rtl or ltr). Default value ltr.
                  enum: [ltr, rtl]
                  default: ltr
                password:
                  type: string
                  format: password
                  description: Optional password to set/change.
                is_primary:
                  type: string
                  description: Optional Primary Contact (set to 'on' to make primary).
                  enum: ["on"]
                donotsendwelcomeemail:
                  type: string
                  description: Optional Do Not Send Welcome Email (set to 'on' to prevent). Ignored on update?
                  enum: ["on"]
                send_set_password_email:
                  type: string
                  description: Optional Send Set Password Email (set to 'on' to send).
                  enum: ["on"]
                permissions:
                  type: array
                  items:
                    type: string
                  description: |
                    Optional Permissions for this contact. Replaces existing.
                    - "1": Invoices, "2": Estimates, "3": Contracts, "4": Proposals, "5": Support, "6": Projects
                  example: ["1", "5"]
                invoice_emails:
                  type: string
                  description: Optional E-Mail Notification for Invoices (set value 'invoice_emails' to enable). Set empty/omit to disable?
                  enum: [invoice_emails]
                estimate_emails:
                  type: string
                  description: Optional E-Mail Notification for Estimate (set value 'estimate_emails' to enable).
                  enum: [estimate_emails]
                credit_note_emails:
                  type: string
                  description: Optional E-Mail Notification for Credit Note (set value 'credit_note_emails' to enable).
                  enum: [credit_note_emails]
                project_emails:
                  type: string
                  description: Optional E-Mail Notification for Project (set value 'project_emails' to enable).
                  enum: [project_emails]
                ticket_emails:
                  type: string
                  description: Optional E-Mail Notification for Tickets (set value 'ticket_emails' to enable).
                  enum: [ticket_emails]
                task_emails:
                  type: string
                  description: Optional E-Mail Notification for Task (set value 'task_emails' to enable).
                  enum: [task_emails]
                contract_emails:
                  type: string
                  description: Optional E-Mail Notification for Contract (set value 'contract_emails' to enable).
                  enum: [contract_emails]
                custom_fields:
                  type: object
                  description: "Custom fields data. Key format: custom_fields[contacts][field_id]. See Custom Fields documentation."
                  additionalProperties: true
      responses:
        '200':
          description: Contact updated successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse'
              example:
                status: true
                message: Contact Updated Successfully
        '400': # For general update fail
          description: Contact update failed (e.g., validation error).
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: Contact update fail # Doc example uses "Contact add fail", assuming typo
        '404': # For contact not found
          description: Contact not found.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
        '409': # Conflict for existing email
          description: Email already exists for another contact.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseDetailed'
              example:
                status: false
                error: {"email":"This Email is already exists"}
                message: "This Email is already exists"

  /contacts/search/{keysearch}:
    get:
      tags:
        - Contacts
      summary: Search Contact Information
      description: Search for contacts based on keywords.
      operationId: searchContacts
      parameters:
        - name: keysearch
          in: path
          required: true
          description: Search Keywords.
          schema:
            type: string
      responses:
        '200':
          description: Search results matching the keywords. Returns detailed contact info including related customer.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Contact' # Schema includes joined customer data
              example: # Single object shown, assuming array response
                - id: "8"
                  userid: "1"
                  is_primary: "0"
                  firstname: "chirag"
                  lastname: "jagani"
                  email: "useremail@gmail.com"
                  phonenumber: ""
                  title: null
                  datecreated: "2020-05-19 20:07:49" # Contact creation date
                  password: "$2a$08$6DLJFalqvJGVymCwW2ppNe9HOG5YUP04vzthXZjOFFUQknxfG6QHe"
                  new_pass_key: null
                  new_pass_key_requested: null
                  email_verified_at: "2020-08-28 21:36:06"
                  email_verification_key: null
                  email_verification_sent_at: null
                  last_ip: null
                  last_login: null
                  last_password_change: null
                  active: "1" # Contact active status
                  profile_image: null
                  direction: null
                  invoice_emails: "0"
                  estimate_emails: "0"
                  credit_note_emails: "0"
                  contract_emails: "0"
                  task_emails: "0"
                  project_emails: "0"
                  ticket_emails: "0"
                  # Joined Customer Fields
                  company: "trueline"
                  vat: ""
                  # phonenumber: "" # Duplicate key name
                  country: "0"
                  city: ""
                  zip: ""
                  state: ""
                  address: ""
                  website: ""
                  # datecreated: "..." # Customer creation date, clashes with contact datecreated
                  # active: "1" # Customer active status
                  leadid: null
                  billing_street: ""
                  billing_city: ""
                  billing_state: ""
                  billing_zip: ""
                  billing_country: "0"
                  shipping_street: ""
                  shipping_city: ""
                  shipping_state: ""
                  shipping_zip: ""
                  shipping_country: "0"
                  longitude: null
                  latitude: null
                  default_language: "english"
                  default_currency: "0"
                  show_primary_contact: "0"
                  stripe_id: null
                  registration_confirmed: "1"
                  addedfrom: "1" # Customer addedfrom
        '404':
          description: No contacts found matching the search criteria.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: No data were found

  # Contracts
  /contracts:
    post:
      tags:
        - Contracts
      summary: Add New Contract
      description: Create a new contract record.
      operationId: createContract
      requestBody:
        description: Contract data to add. Uses multipart/form-data.
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required:
                - subject
                - datestart
                - client
              properties:
                subject:
                  type: string
                  description: Mandatory Contract subject.
                datestart:
                  type: string
                  format: date
                  description: Mandatory Contract start date (YYYY-MM-DD).
                client:
                  type: integer # Doc says Number (Customer ID)
                  description: Mandatory Customer ID.
                dateend:
                  type: string
                  format: date
                  description: Optional Contract end date (YYYY-MM-DD).
                contract_type:
                  type: integer # Doc says Number (Type ID)
                  description: Optional Contract type ID.
                contract_value:
                  type: number # Doc says Number (Decimal value)
                  format: float
                  description: Optional Contract value.
                description:
                  type: string
                  description: Optional Contract description (summary).
                content:
                  type: string
                  description: Optional Contract content (details, often HTML).
                custom_fields:
                  type: object
                  description: "Custom fields data. Key format: custom_fields[contracts][field_id]. See Custom Fields documentation."
                  additionalProperties: true
      responses:
        '200': # Doc shows 200 OK for success
          description: Contract added successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse'
              example:
                status: true
                message: Contract Added Successfully
        '400': # Doc shows 404 with message "Contract ID Exists" - seems like 409 Conflict or 400 Bad Request might be better? Using 400 for general failure.
          description: Contract add failed (e.g., validation error, duplicate?).
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example: # Example from docs (using 400 code instead of 404)
                status: false
                message: Contract ID Exists # Or generic "Contract add fail"

  /contracts/{id}:
    get:
      tags:
        - Contracts
      summary: Request Contract information
      description: Retrieve information for a specific contract by its ID.
      operationId: getContractById
      parameters:
        - name: id
          in: path
          required: true
          description: Contract unique ID.
          schema:
            type: integer # Assuming numeric ID
            format: int64
      responses:
        '200':
          description: Contract information retrieved successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Contract'
              example: # Example from documentation
                id: "1"
                content: ""
                description: "Lorem Ipsum..."
                subject: "New Contract"
                client: "9"
                datestart: "2022-11-21"
                dateend: "2027-11-21"
                contract_type: "1"
                project_id: "0"
                addedfrom: "1"
                dateadded: "2022-11-21 12:45:58"
                isexpirynotified: "0"
                contract_value: "13456.00"
                trash: "0"
                not_visible_to_client: "0"
                hash: "31caaa36b9ea1f45a688c7e859d3ae70"
                signed: "0"
                signature: null
                marked_as_signed: "0"
                acceptance_firstname: null
                acceptance_lastname: null
                acceptance_email: null
                acceptance_date: null
                acceptance_ip: null
                short_link: null
                # Joined type name
                name: "Development Contracts"
                # Joined customer info
                userid: "9"
                company: "8web"
                vat: ""
                phonenumber: ""
                country: "0"
                city: ""
                zip: ""
                state: ""
                address: ""
                website: ""
                datecreated: "2022-08-11 14:07:26"
                active: "1"
                leadid: null
                billing_street: ""
                # ... other customer fields ...
                # Joined type name again?
                type_name: "Development Contracts"
                attachments: []
                customfields: []
        '404':
          description: Contract not found.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: No data were found.

    delete:
      tags:
        - Contracts
      summary: Delete Contract
      description: Delete a specific contract by its ID.
      operationId: deleteContract
      parameters:
        - name: id
          in: path
          required: true
          description: Contract unique ID to delete.
          schema:
            type: integer # Assuming numeric ID
            format: int64
      responses:
        '200':
          description: Contract deleted successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse'
              example:
                status: true
                message: Contract Deleted Successfully
        '404':
          description: Contract not found or delete failed.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: Contract Delete Fail

    put: # PUT endpoint not explicitly defined but implied by standard REST practice and existence of POST/DELETE/GET
      tags:
        - Contracts
      summary: Update Contract
      description: Update an existing contract record. Parameters likely similar to POST.
      operationId: updateContract
      parameters:
        - name: id
          in: path
          required: true
          description: Contract unique ID to update.
          schema:
            type: integer
            format: int64
      requestBody:
        description: Contract data to update. Uses multipart/form-data. Fields optional.
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                # Assuming same fields as POST but optional
                subject:
                  type: string
                datestart:
                  type: string
                  format: date
                client:
                  type: integer
                dateend:
                  type: string
                  format: date
                contract_type:
                  type: integer
                contract_value:
                  type: number
                  format: float
                description:
                  type: string
                content:
                  type: string
                custom_fields:
                  type: object
                  description: "Custom fields data. Key format: custom_fields[contracts][field_id]. See Custom Fields documentation."
                  additionalProperties: true
      responses:
        '200':
          description: Contract updated successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse'
              # example: { status: true, message: "Contract Updated Successfully" } # No example provided
        '400':
          description: Contract update failed (e.g., validation error).
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              # example: { status: false, message: "Contract Update Fail" } # No example provided
        '404':
          description: Contract not found.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'

  # Credit Notes
  /credit_notes:
    post:
      tags:
        - Credit Notes
      summary: Add New Credit Notes
      description: Create a new credit note.
      operationId: createCreditNote
      requestBody:
        description: Credit note data to add. Uses multipart/form-data.
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required:
                - clientid
                - date
                - number
                - currency
                - newitems
                - subtotal
                - total
              properties:
                clientid:
                  type: integer # Doc says Number
                  description: Mandatory Customer ID.
                date:
                  type: string
                  format: date
                  description: Mandatory Credit Note Date (YYYY-MM-DD).
                number:
                  type: integer # Doc says Number
                  description: Mandatory Credit Note Number. Needs to be unique.
                currency:
                  type: integer # Doc says Number (Currency ID)
                  description: Mandatory currency field (Currency ID).
                newitems:
                  type: array
                  items:
                     $ref: '#/components/schemas/CreditNoteItem' # Define item structure
                  description: Mandatory New Items to be added. Array of item objects.
                billing_street:
                  type: string
                  description: Optional Street Address.
                billing_city:
                  type: string
                  description: Optional City Name for billing.
                billing_state:
                  type: string
                  description: Optional Name of state for billing.
                billing_zip:
                  type: integer # Doc says Number, but zip can be alphanumeric? Use string? Using integer based on doc.
                  description: Optional Zip code.
                billing_country:
                  type: integer # Doc says Number (Country ID)
                  description: Optional Country code ID.
                shipping_street:
                  type: string
                  description: Optional Address of shipping.
                shipping_city:
                  type: string
                  description: Optional City name for shipping.
                shipping_state:
                  type: string
                  description: Optional Name of state for shipping.
                shipping_zip:
                  type: integer # Doc says Number
                  description: Optional Zip code for shipping.
                shipping_country:
                  type: integer # Doc says Number (Country ID)
                  description: Optional Country code ID for shipping.
                include_shipping: # Not listed in POST params but present in GET/PUT
                   type: string
                   enum: ["1"] # Value should be '1' to include/show shipping?
                   description: Set to '1' to include shipping address.
                show_shipping_on_credit_note: # Not listed in POST params but present in GET/PUT
                   type: string
                   enum: ["1"]
                   description: Set to '1' to show shipping details on the PDF.
                discount_type:
                  type: string
                  description: Optional discount type ('before_tax' or 'after_tax').
                  enum: [before_tax, after_tax]
                discount_percent: # Not listed in POST but needed if type is set?
                  type: number
                  format: float
                  description: Discount percentage (e.g., 10 for 10%). Required if discount_type is set.
                discount_total: # Not listed in POST but needed if type is set?
                  type: number
                  format: float
                  description: Discount fixed amount. Required if discount_type is set.
                adjustment: # Not listed in POST but present in GET/PUT
                  type: number
                  format: float
                  description: Optional adjustment amount (positive or negative).
                adminnote: # Doc uses 'Admin Note] Optional.' format? Assuming 'adminnote'
                  type: string
                  description: Optional Admin Note.
                subtotal:
                  type: number # Doc says Decimal
                  format: float
                  description: Mandatory calculated subtotal (sum of items before tax/discount). Should be calculated by client?
                total:
                  type: number # Doc says Decimal
                  format: float
                  description: Mandatory calculated total amount. Should be calculated by client?
                clientnote:
                  type: string
                  description: Optional client notes.
                terms:
                  type: string
                  description: Optional Terms.
                custom_fields:
                  type: object
                  description: "Custom fields data. Key format: custom_fields[credit_note][field_id]. See Custom Fields documentation."
                  additionalProperties: true
      responses:
        '200': # Doc shows 200 OK for success
          description: Credit Note added successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse'
              example:
                status: true
                message: Credit Note Added Successfully
        '400': # Doc shows 404 but 400 is better for validation errors
          description: Credit Note add failed (validation errors).
          content:
            application/json:
              schema:
                # Assuming simple error message, but could be detailed
                $ref: '#/components/schemas/ErrorResponseSimple'
                # Could also be ErrorResponseDetailed if specific fields are returned
                # example: { "status": false, "error": { "number": "The Credit Note number is already in use" }, "message": "Credit Note Add Fail" }
              example:
                status: false
                message: Credit Note Add Fail # Or specific error like "The Items field is required"

  /credit_notes/{id}:
    get:
      tags:
        - Credit Notes
      summary: Request Credit notes information
      description: Retrieve information for a specific credit note by its ID.
      operationId: getCreditNoteById
      parameters:
        - name: id
          in: path
          required: true
          description: Credit Note unique ID.
          schema:
            type: integer # Assuming numeric ID
            format: int64
      responses:
        '200':
          description: Credit Note information retrieved successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CreditNote'
              example: # Example from documentation
                id: "2"
                clientid: "1"
                deleted_customer_name: null
                number: "2"
                prefix: "CN-"
                number_format: "1"
                datecreated: "2021-07-30 16:29:46"
                date: "2021-08-02"
                adminnote: "adminnote2"
                terms: ""
                clientnote: ""
                currency: "1"
                subtotal: "1200.00"
                total_tax: "0.00"
                total: "1200.00"
                adjustment: "0.00"
                addedfrom: "1"
                status: "1"
                project_id: "0"
                discount_percent: "0.00"
                discount_total: "0.00"
                discount_type: ""
                billing_street: "Test"
                billing_city: "Test"
                billing_state: "Test"
                billing_zip: "3000"
                billing_country: "102"
                shipping_street: "Test"
                shipping_city: "Test"
                shipping_state: "Test"
                shipping_zip: "3000"
                shipping_country: "102"
                include_shipping: "1"
                show_shipping_on_credit_note: "1"
                show_quantity_as: "1"
                reference_no: ""
                # Joined Customer Data
                userid: "1"
                company: "Test"
                vat: ""
                phonenumber: "01324568903"
                country: "102"
                city: "Test"
                zip: "3000"
                state: "Test"
                address: "Test"
                website: ""
                active: "1"
                leadid: null
                longitude: null
                latitude: null
                default_language: ""
                default_currency: "0"
                show_primary_contact: "0"
                stripe_id: null
                registration_confirmed: "1"
                credit_note_id: "2" # Duplicate ID?
                customfields: []
        '404':
          description: Credit Note not found.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: No data were found

    put: # Doc shows PUT path as /api/credit_notes, but should be /api/credit_notes/{id}. Assuming standard REST.
      tags:
        - Credit Notes
      summary: Update a Credit Note
      description: Update an existing credit note.
      operationId: updateCreditNote
      parameters:
        - name: id
          in: path
          required: true
          description: Credit Note unique ID to update.
          schema:
            type: integer
            format: int64
      requestBody:
        description: Credit note data to update. Uses multipart/form-data.
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required: # Assuming these remain mandatory
                - clientid
                - date
                - number
                - currency
                # - newitems # Only for adding new?
                # - items # For updating existing
                - subtotal
                - total
              properties:
                clientid:
                  type: integer
                  description: Mandatory Customer ID.
                date:
                  type: string
                  format: date
                  description: Mandatory Credit Note Date (YYYY-MM-DD).
                number:
                  type: integer
                  description: Mandatory Credit Note Number. Must be unique (except for the current one).
                currency:
                  type: integer
                  description: Mandatory currency field (Currency ID).
                newitems:
                  type: array
                  items:
                    $ref: '#/components/schemas/CreditNoteItem'
                  description: Optional. New Items to be added. Array of item objects.
                items:
                  type: array
                  items:
                    type: object # Existing items need 'id' along with other fields
                    properties:
                       id:
                         type: integer
                         description: ID of the existing item line to update.
                       description:
                         type: string
                       long_description:
                         type: string
                       rate:
                         type: number
                         format: float
                       qty:
                         type: integer
                       unit:
                         type: string
                       taxname:
                         type: string
                       taxname_2:
                         type: string
                       item_order: # Needed to maintain order?
                         type: integer
                  description: Optional. Existing items to update. Include item line ID.
                removed_items:
                  type: array
                  items:
                    type: integer # Array of item line IDs to remove
                  description: Optional. Items to be removed (Array of item line IDs).
                billing_street:
                  type: string
                  description: Optional Street Address.
                billing_city:
                  type: string
                  description: Optional City Name for billing.
                billing_state:
                  type: string
                  description: Optional Name of state for billing.
                billing_zip:
                  type: integer
                  description: Optional Zip code.
                billing_country:
                  type: integer
                  description: Optional Country code ID.
                shipping_street:
                  type: string
                  description: Optional Address of shipping.
                shipping_city:
                  type: string
                  description: Optional City name for shipping.
                shipping_state:
                  type: string
                  description: Optional Name of state for shipping.
                shipping_zip:
                  type: integer
                  description: Optional Zip code for shipping.
                shipping_country:
                  type: integer
                  description: Optional Country code ID for shipping.
                include_shipping:
                   type: string
                   enum: ["1"]
                   description: Set to '1' to include/show shipping address.
                show_shipping_on_credit_note:
                   type: string
                   enum: ["1"]
                   description: Set to '1' to show shipping details on the PDF.
                discount_type:
                  type: string
                  description: Optional discount type ('before_tax' or 'after_tax').
                  enum: [before_tax, after_tax]
                discount_percent:
                  type: number
                  format: float
                  description: Discount percentage.
                discount_total:
                  type: number
                  format: float
                  description: Discount fixed amount.
                adjustment:
                  type: number
                  format: float
                  description: Optional adjustment amount.
                adminnote:
                  type: string
                  description: Optional Admin Note.
                subtotal:
                  type: number
                  format: float
                  description: Mandatory calculated subtotal.
                total:
                  type: number
                  format: float
                  description: Mandatory calculated total amount.
                clientnote:
                  type: string
                  description: Optional client notes.
                terms:
                  type: string
                  description: Optional Terms.
                custom_fields:
                  type: object
                  description: "Custom fields data. Key format: custom_fields[credit_note][field_id]. See Custom Fields documentation."
                  additionalProperties: true
      responses:
        '200':
          description: Credit Note updated successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse'
              example:
                status: true
                message: Credit Note Updated Successfully
        '400': # Doc shows 404 but 400 is better for validation errors
          description: Credit Note update failed (validation errors).
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: Credit Note Update Fail # Or specific error
        '404':
           description: Credit Note not found.
           content:
             application/json:
               schema:
                 $ref: '#/components/schemas/ErrorResponseSimple'

    delete:
      tags:
        - Credit Notes
      summary: Delete Credit Note
      description: Delete a specific credit note by its ID.
      operationId: deleteCreditNote
      parameters:
        - name: id
          in: path
          required: true
          description: Credit Note unique ID to delete.
          schema:
            type: integer
            format: int64
      responses:
        '200':
          description: Credit Note deleted successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse'
              example:
                status: true
                message: Credit Note Deleted Successfully
        '404':
          description: Credit Note not found or delete failed.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: Credit Note Delete Fail

  /credit_notes/search/{keysearch}:
    get:
      tags:
        - Credit Notes
      summary: Search credit notes information
      description: Search for credit notes based on keywords.
      operationId: searchCreditNotes
      parameters:
        - name: keysearch
          in: path
          required: true
          description: Search Keywords.
          schema:
            type: string
      responses:
        '200':
          description: Search results matching the keywords.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/CreditNote'
              example: # Example from documentation (assuming array response)
               - id: "2"
                 clientid: "1"
                 deleted_customer_name: null
                 number: "2"
                 prefix: "CN-"
                 number_format: "1"
                 datecreated: "2021-07-30 16:29:46"
                 date: "2021-08-02"
                 adminnote: "adminnote2"
                 terms: ""
                 clientnote: ""
                 currency: "1"
                 subtotal: "1200.00"
                 total_tax: "0.00"
                 total: "1200.00"
                 adjustment: "0.00"
                 addedfrom: "1"
                 status: "1"
                 project_id: "0"
                 discount_percent: "0.00"
                 discount_total: "0.00"
                 discount_type: ""
                 billing_street: "Test"
                 # ... rest of fields matching GET example ...
                 company: "test" # Corrected example value
                 credit_note_id: "2"
                 customfields: []
        '404':
          description: No credit notes found matching the search criteria.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: No data were found

  # Custom Fields (Specific endpoint for retrieving definitions/values)
  /custom_fields/{FieldBelongsto}/{id}:
    get:
      tags:
        - Custom Fields
      summary: Request Values of Custom Fields
      description: |
        Retrieve the defined custom fields and their values for a specific record.
        The `id` parameter is optional; omitting it might list field definitions without values for the specified type.
      operationId: getCustomFieldValues
      parameters:
        - name: FieldBelongsto
          in: path
          required: true
          description: The type of record the custom fields belong to.
          schema:
            type: string
            enum:
              - Company
              - Leads
              - Customers
              - Contacts
              - Staff
              - Contracts
              - Tasks
              - Expenses
              - Invoice # Invoice items? or Invoice itself? Doc implies Invoice
              - Items # Separate from Invoice items?
              # - Note # From doc - probably internal note, less common via API?
              - Estimate
              # - Contract # Duplicate? Already listed
              - Proposal
              - Projects
              - Tickets
        - name: id # Doc says optional, but it's in the path? Path params usually required. Maybe /custom_fields/{FieldBelongsto}?id={id} is intended? Sticking to doc path.
          in: path
          required: true # Path parameters are required. Doc description says optional, which is confusing.
          description: Optional unique ID of the specific record (e.g., Invoice ID, Customer ID) to get values for. If omitted/zero behavior might differ (definitions only?).
          schema:
            type: integer
            format: int64
      responses:
        '200':
          description: Custom fields information with values for the specified record.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/CustomFieldDetail'
              example: # Example from documentation
                - field_name: "custom_fields[invoice][1]"
                  custom_field_id: "1"
                  label: "Input 1"
                  required: "0"
                  type: "input"
                  value: "input1 data"
                - field_name: "custom_fields[invoice][2]"
                  custom_field_id: "2"
                  label: "Number 1"
                  required: "0"
                  type: "number"
                  value": "12"
                # ... rest of example fields
        '404':
          description: No custom fields found for the specified type/ID, or the record itself was not found.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: No data were found

  # Estimates
  /estimates:
    post:
      tags:
        - Estimates
      summary: Add New Estimates
      description: Create a new estimate record.
      operationId: createEstimate
      requestBody:
        description: Estimate data to add. Uses multipart/form-data.
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required:
                - clientid
                - number
                - date
                - currency
                - newitems
                - subtotal
                - total
              properties:
                clientid:
                  type: integer # Doc says Number
                  description: Mandatory Customer ID.
                number:
                  type: integer # Doc says Number
                  description: Mandatory Estimate Number. Needs to be unique.
                date:
                  type: string
                  format: date
                  description: Mandatory Estimate Date (YYYY-MM-DD).
                duedate: # Called expirydate in GET response
                  type: string
                  format: date
                  description: Optional Expiry Date of Estimate (YYYY-MM-DD).
                currency:
                  type: integer # Doc says Number (Currency ID)
                  description: Mandatory currency field (Currency ID).
                newitems:
                  type: array
                  items:
                     $ref: '#/components/schemas/EstimateItem' # Define item structure
                  description: Mandatory New Items to be added. Array of item objects.
                subtotal:
                  type: number # Doc says Decimal
                  format: float
                  description: Mandatory calculated subtotal. Client calculation needed?
                total:
                  type: number # Doc says Decimal
                  format: float
                  description: Mandatory calculated total amount. Client calculation needed?
                billing_street:
                  type: string
                  description: Optional Street Address.
                billing_city:
                  type: string
                  description: Optional City Name for billing.
                billing_state:
                  type: string
                  description: Optional Name of state for billing.
                billing_zip:
                  type: integer # Doc says Number
                  description: Optional Zip code.
                billing_country:
                  type: integer # Doc says Number (Country ID)
                  description: Optional Country code ID.
                shipping_street:
                  type: string
                  description: Optional Address of shipping.
                shipping_city:
                  type: string
                  description: Optional City name for shipping.
                shipping_state:
                  type: string
                  description: Optional Name of state for shipping.
                shipping_zip:
                  type: integer # Doc says Number
                  description: Optional Zip code for shipping.
                shipping_country:
                  type: integer # Doc says Number (Country ID)
                  description: Optional Country code ID for shipping.
                include_shipping: # Not listed in POST params but present in GET/PUT
                   type: string
                   enum: ["1"]
                   description: Set to '1' to include/show shipping address.
                show_shipping_on_estimate: # Not listed in POST params but present in GET/PUT
                   type: string
                   enum: ["1"]
                   description: Set to '1' to show shipping details on the PDF.
                tags:
                  type: string
                  description: Optional comma-separated TAGS.
                status:
                  type: integer # Doc says Number (Status ID)
                  description: Optional Status ID (e.g., 1 for Draft, 2 for Sent, 3 Accepted, etc.). Default is Accepted (?).
                reference_no: # Called 'Reference' in docs param table
                  type: string
                  description: Optional Reference name/number.
                sale_agent:
                  type: integer # Doc says Number (Staff ID)
                  description: Optional Sale Agent ID.
                adminnote:
                  type: string
                  description: Optional notes by admin.
                clientnote:
                  type: string
                  description: Optional client notes.
                terms:
                  type: string
                  description: Optional Terms.
                discount_type: # Not listed in POST but likely needed
                  type: string
                  enum: [before_tax, after_tax]
                discount_percent:
                  type: number
                  format: float
                discount_total:
                  type: number
                  format: float
                adjustment: # Not listed in POST but present in GET/PUT
                  type: number
                  format: float
                custom_fields:
                  type: object
                  description: "Custom fields data. Key format: custom_fields[estimate][field_id]. See Custom Fields documentation."
                  additionalProperties: true
      responses:
        '200': # Doc shows 200 OK for success
          description: Estimate Added Successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse'
              example:
                status: true
                message: Estimates Added Successfully
        '400': # Doc shows 404 but 400 is better for validation errors
          description: Estimate add failed (validation errors).
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
                # Could also be ErrorResponseDetailed
              example:
                status: false
                message: Estimates Add Fail # Or specific error

  /estimates/{id}:
    get:
      tags:
        - Estimates
      summary: Request Estimate information
      description: Retrieve information for a specific estimate by its ID.
      operationId: getEstimateById
      parameters:
        - name: id
          in: path
          required: true
          description: Estimate unique ID.
          schema:
            type: integer # Assuming numeric ID
            format: int64
      responses:
        '200':
          description: Estimate information retrieved successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Estimate'
              example: # Example from documentation
                id: "1"
                sent: "0"
                # ... (full example structure from Estimate schema) ...
                items:
                  - id: "2"
                    rel_id: "1"
                    rel_type: "estimate"
                    description: "test"
                    long_description: "test"
                    qty: "1.00"
                    rate: "1200.00"
                    unit: "1"
                    item_order": "1"
                client:
                  userid: "1"
                  company: "test"
                  # ... (full customer structure) ...
                customfields: []
        '404':
          description: Estimate not found.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: No data were found

    put:
      tags:
        - Estimates
      summary: Update an estimate
      description: Update an existing estimate's information.
      operationId: updateEstimate
      parameters:
        - name: id
          in: path
          required: true
          description: Estimate unique ID to update.
          schema:
            type: integer
            format: int64
      requestBody:
        description: Estimate data to update. Uses multipart/form-data.
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required: # Assuming these remain mandatory
                - clientid
                - billing_street # Why mandatory on update? Maybe not.
                - number
                - date
                - currency
                - status
                - subtotal
                - total
              properties:
                clientid:
                  type: integer # Doc says String? Assuming integer ID.
                  description: Mandatory Customer ID.
                billing_street:
                  type: string
                  description: Mandatory Street Address.
                billing_city:
                  type: string
                  description: Optional City Name for billing.
                billing_state:
                  type: string
                  description: Optional Name of state for billing.
                billing_zip:
                  type: integer # Doc says Number
                  description: Optional Zip code.
                billing_country:
                  type: integer # Doc says Number (Country ID)
                  description: Optional Country code ID.
                include_shipping:
                  type: boolean # Doc says boolean
                  description: Optional. set yes if you want add/update Shipping Address. Default false.
                show_shipping_on_estimate:
                  type: boolean # Doc says boolean
                  description: Optional. Shows shipping details in estimate.
                shipping_street:
                  type: string
                  description: Optional Address of shipping (required if include_shipping=true?).
                shipping_city:
                  type: string
                  description: Optional City name for shipping.
                shipping_state:
                  type: string
                  description: Optional Name of state for shipping.
                shipping_zip:
                  type: integer # Doc says Number
                  description: Optional Zip code for shipping.
                shipping_country:
                  type: integer # Doc says Number (Country ID)
                  description: Optional Country code ID for shipping.
                number:
                  type: integer # Doc says Number
                  description: Mandatory Estimate Number. Must be unique (except current).
                date:
                  type: string
                  format: date
                  description: Mandatory Estimate Date (YYYY-MM-DD).
                expirydate:
                  type: string
                  format: date
                  description: Optional Expiry Date of Estimate (YYYY-MM-DD).
                tags:
                  type: string
                  description: Optional comma-separated TAGS.
                currency:
                  type: integer # Doc says Number (Currency ID)
                  description: Mandatory currency field (Currency ID).
                status:
                  type: integer # Doc says Number (Status ID)
                  description: Mandatory Estimate Status ID.
                reference_no:
                  type: string
                  description: Optional Reference #.
                sale_agent:
                  type: integer # Doc says Number (Staff ID)
                  description: Optional Sale Agent ID.
                discount_type:
                  type: string
                  description: Optional discount type ('before_tax' or 'after_tax').
                  enum: [before_tax, after_tax]
                adminnote:
                  type: string
                  description: Optional notes by admin.
                items:
                  type: array
                  items:
                    type: object # Existing items need 'id'
                    properties:
                       id:
                         type: integer
                       # ... other item fields ...
                  description: Optional. Existing items to update. Include item line ID.
                removed_items:
                  type: array
                  items:
                    type: integer # Array of item line IDs
                  description: Optional. Items to be removed (Array of item line IDs).
                newitems:
                  type: array
                  items:
                    $ref: '#/components/schemas/EstimateItem'
                  description: Optional. New Items to be added. Array of item objects.
                subtotal:
                  type: number # Doc says Decimal
                  format: float
                  description: Mandatory calculated subtotal.
                total:
                  type: number # Doc says Decimal
                  format: float
                  description: Mandatory calculated total amount.
                adjustment:
                  type: number
                  format: float
                  description: Optional adjustment amount.
                clientnote:
                  type: string
                  description: Optional client notes.
                terms:
                  type: string
                  description: Optional Terms.
                custom_fields:
                  type: object
                  description: "Custom fields data. Key format: custom_fields[estimate][field_id]. See Custom Fields documentation."
                  additionalProperties: true
      responses:
        '200':
          description: Estimate Updated Successfully. (Doc response says status: false? Assuming typo).
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse'
              example:
                status: true # Corrected from false in docs example
                message: Estimate Updated Successfully
        '400': # Doc shows 404 but 400 is better for validation/update fail
          description: Estimate update failed (e.g., validation error, number exists).
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
                # Could be ErrorResponseDetailed if number conflict is specific
              example:
                status: false
                message: Estimate Update Fail # Or "The Estimate number is already in use"
        '404':
           description: Estimate not found.
           content:
             application/json:
               schema:
                 $ref: '#/components/schemas/ErrorResponseSimple'

    delete:
      tags:
        - Estimates
      summary: Delete Estimate
      description: Delete a specific estimate by its ID.
      operationId: deleteEstimate
      parameters:
        - name: id
          in: path
          required: true
          description: Estimate unique ID to delete.
          schema:
            type: integer
            format: int64
      responses:
        '200':
          description: Estimate deleted successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse'
              example:
                status: true
                message: Estimate Deleted Successfully
        '404':
          description: Estimate not found or delete failed.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: Estimate Delete Fail

  /estimates/search/{keysearch}:
    get:
      tags:
        - Estimates
      summary: Search Estimate information
      description: Search for estimates based on keywords.
      operationId: searchEstimates
      parameters:
        - name: keysearch
          in: path
          required: true
          description: Search Keywords.
          schema:
            type: string
      responses:
        '200':
          description: Search results matching the keywords.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Estimate' # Includes joined customer data
              example: # Example from documentation (assuming array response)
                - id: "2"
                  sent: "0"
                  # ... (full example structure from Estimate schema) ...
                  estimateid: "2" # Duplicate ID?
                  customfields": []
        '404':
          description: No estimates found matching the search criteria.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: No Data Were Found

  # Expense Categories (Common Data)
  /common/expense_category:
    get:
      tags:
        - Expense Categories
        - Common Data # Adding a tag for common lookup endpoints
      summary: Request Expense category
      description: Retrieve a list of all available expense categories.
      operationId: listExpenseCategories
      responses:
        '200':
          description: A list of expense categories.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/ExpenseCategory'
              example: # Doc example has extra {} ? Correcting format.
                - id: "1"
                  name": "cloud server"
                  description: "AWS server"
                - id: "2"
                  name: "website domain"
                  description: "domain Managment and configurations"
        '404':
          description: No expense categories found.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: No data were found

  # Expenses
  /expenses:
    post:
      tags:
        - Expenses
      summary: Add Expense
      description: Create a new expense record.
      operationId: createExpense
      requestBody:
        description: Expense data to add. Uses multipart/form-data.
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required:
                - category
                - amount
                - date
                - currency
              properties:
                expense_name:
                  type: string
                  description: Optional Expanse Name.
                note:
                  type: string
                  description: Optional Expanse Note.
                category:
                  type: integer # Doc says Number (Category ID)
                  description: Mandatory Expense Category ID.
                amount:
                  type: number # Doc says Decimal
                  format: float
                  description: Mandatory Expense Amount.
                date:
                  type: string
                  format: date
                  description: Mandatory Expense Date (YYYY-MM-DD).
                clientid:
                  type: integer # Doc says Number (Customer ID)
                  description: Optional Customer ID (if expense is related to a client).
                project_id: # Not in POST params but present in GET/PUT
                  type: integer
                  description: Optional Project ID (if expense is related to a project).
                currency:
                  type: integer # Doc says Number (Currency ID)
                  description: Mandatory Currency ID.
                tax:
                  type: integer # Doc says Number (Tax ID)
                  description: Optional Tax 1 ID.
                tax2:
                  type: integer # Doc says Number (Tax ID 2)
                  description: Optional Tax 2 ID.
                paymentmode:
                  type: integer # Doc says Number (Payment Mode ID)
                  description: Optional Payment mode ID.
                reference_no:
                  type: string
                  description: Optional Reference #.
                billable: # Not in POST params but present in GET/PUT
                  type: integer
                  enum: [0, 1]
                  description: Optional. Mark expense as billable (1) or not (0).
                recurring: # Doc says String ('1' to '12' or 'custom')
                  type: string
                  description: Optional. Set recurring frequency ('1' to '12' for months, or 'custom').
                  enum: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'custom']
                repeat_every_custom:
                  type: integer # Doc says Number
                  description: Optional. Required if recurring is 'custom'. Interval number.
                repeat_type_custom:
                  type: string
                  description: Optional. Required if recurring is 'custom'. Interval unit ('day', 'week', 'month', 'year').
                  enum: [day, week, month, year]
                cycles: # Not in POST params but present in GET/PUT
                   type: integer
                   description: Optional. Number of recurring cycles (0 for infinite).
                custom_fields:
                  type: object
                  description: "Custom fields data. Key format: custom_fields[expenses][field_id]. See Custom Fields documentation."
                  additionalProperties: true
      responses:
        '200': # Doc shows 200 OK for success
          description: Expense added successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse'
              example:
                status: true
                message: Expense Added Successfully
        '400': # Doc shows 404 but 400 is better for validation errors
          description: Expense add failed (validation errors).
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
                # Could be ErrorResponseDetailed if specific fields are returned
              example:
                status: false
                message: Expense Add Fail # Or specific error like "The Amount field is required."

  /expenses/{id}:
    get:
      tags:
        - Expenses
      summary: Request Expense information
      description: Retrieve information for a specific expense by its ID.
      operationId: getExpenseById
      parameters:
        - name: id
          in: path
          required: true
          description: Expense unique ID.
          schema:
            type: integer # Assuming numeric ID
            format: int64
      responses:
        '200':
          description: Expense information retrieved successfully. Includes joined data.
          content:
            application/json:
              # Response is array with one object in docs? Assuming single object normally.
              schema:
                 $ref: '#/components/schemas/Expense'
              example: # Example from documentation (single object from array)
                  id: "1"
                  category: "1"
                  currency: "1"
                  amount: "50.00"
                  tax: "0"
                  tax2": "0"
                  reference_no: "012457893"
                  note: "AWS server hosting charges"
                  expense_name: "Cloud Hosting"
                  clientid: "1"
                  project_id: "0"
                  billable: "0"
                  invoiceid": null
                  paymentmode: "2"
                  date: "2021-09-01"
                  recurring_type: "month"
                  repeat_every: "1"
                  recurring: "1"
                  cycles: "12"
                  total_cycles: "0"
                  custom_recurring: "0"
                  last_recurring_date: null
                  create_invoice_billable: "0"
                  send_invoice_to_customer: "0"
                  recurring_from: null
                  dateadded: "2021-09-01 12:26:34"
                  addedfrom: "1"
                  is_expense_created_in_xero": "0"
                  # Joined data...
                  userid: "1"
                  company: "Company A"
                  # ... other customer fields ...
                  name: "Hosting Management" # Category Name
                  description: "server space and other settings" # Category Desc
                  # ... other category fields ...
                  taxrate: null
                  category_name: "Hosting Management"
                  payment_mode_name: "Paypal"
                  tax_name: null
                  tax_name2: null
                  taxrate2: null
                  expenseid: "1" # Duplicate ID?
                  customfields: []
        '404':
          description: Expense not found.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: No data were found

    put: # Doc path is /api/expenses, should be /api/expenses/{id}. Assuming standard REST.
      tags:
        - Expenses
      summary: Update an Expense
      description: Update an existing expense record.
      operationId: updateExpense
      parameters:
        - name: id
          in: path
          required: true
          description: Expense unique ID to update.
          schema:
            type: integer
            format: int64
      requestBody:
        description: Expense data to update. Uses multipart/form-data. Fields optional.
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required: # Assuming these remain mandatory for update
                - category
                - amount
                - date
                - currency
              properties:
                # Same properties as POST, mostly optional
                expense_name:
                  type: string
                note:
                  type: string
                category:
                  type: integer
                amount:
                  type: number
                  format: float
                date:
                  type: string
                  format: date
                clientid:
                  type: integer
                project_id:
                  type: integer
                currency:
                  type: integer
                tax:
                  type: integer
                tax2:
                  type: integer
                paymentmode:
                  type: integer
                reference_no:
                  type: string
                billable:
                  type: integer
                  enum: [0, 1]
                recurring:
                  type: string
                  enum: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'custom']
                repeat_every_custom:
                  type: integer
                repeat_type_custom:
                  type: string
                  enum: [day, week, month, year]
                cycles:
                   type: integer
                custom_fields:
                  type: object
                  description: "Custom fields data. Key format: custom_fields[expenses][field_id]. See Custom Fields documentation."
                  additionalProperties: true
      responses:
        '200':
          description: Expense updated successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse'
              example:
                status: true
                message: Expense Updated Successfully
        '400': # Doc shows 404 but 400 is better for validation errors
          description: Expense update failed (validation errors).
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: Expense Update Fail # Or specific error
        '404':
           description: Expense not found.
           content:
             application/json:
               schema:
                 $ref: '#/components/schemas/ErrorResponseSimple'

    delete:
      tags:
        - Expenses
      summary: Delete Expense
      description: Delete a specific expense by its ID.
      operationId: deleteExpense
      parameters:
        - name: id
          in: path
          required: true
          description: Expense unique ID to delete.
          schema:
            type: integer
            format: int64
      responses:
        '200':
          description: Expense deleted successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse'
              example:
                status: true
                message: Expense Deleted Successfully
        '404':
          description: Expense not found or delete failed.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: Expense Delete Fail

  /expenses/search/{keysearch}:
    get:
      tags:
        - Expenses
      summary: Search Expenses information
      description: Search for expenses based on keywords.
      operationId: searchExpenses
      parameters:
        - name: keysearch
          in: path
          required: true
          description: Search Keywords.
          schema:
            type: string
      responses:
        '200':
          description: Search results matching the keywords. Includes joined data.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Expense'
              example: # Example from documentation (assuming array response)
               - id: "1"
                 category: "1"
                 # ... (full example structure from Expense schema) ...
                 expenseid: "1"
                 customfields: []
        '404':
          description: No expenses found matching the search criteria.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: No data were found

  # Invoices
  /invoices:
    post:
      tags:
        - Invoices
      summary: Add New invoice
      description: Create a new invoice.
      operationId: createInvoice
      requestBody:
        description: Invoice data to add. Uses multipart/form-data.
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required:
                - clientid
                - number
                - date
                - currency
                - newitems
                - subtotal
                - total
                - billing_street
                - allowed_payment_modes
              properties:
                clientid:
                  type: integer # Doc says Number
                  description: Mandatory Customer ID.
                number:
                  type: integer # Doc says Number
                  description: Mandatory Invoice Number. Needs to be unique.
                date:
                  type: string
                  format: date
                  description: Mandatory Invoice Date (YYYY-MM-DD).
                currency:
                  type: integer # Doc says Number (Currency ID)
                  description: Mandatory currency field (Currency ID).
                newitems:
                  type: array
                  items:
                     # Define item structure - Reuse InvoiceItem? Or specific POST structure?
                     $ref: '#/components/schemas/InvoiceItem' # Reusing GET structure, may need adjustment
                  description: Mandatory New Items to be added. Array of item objects.
                subtotal:
                  type: number # Doc says Decimal
                  format: float
                  description: Mandatory calculated subtotal. Client calculation needed?
                total:
                  type: number # Doc says Decimal
                  format: float
                  description: Mandatory calculated total amount. Client calculation needed?
                billing_street:
                  type: string
                  description: Mandatory Street Address.
                allowed_payment_modes:
                  type: array
                  items:
                    type: integer # Assuming array of Payment Mode IDs
                  description: Mandatory. Array of allowed Payment mode IDs.
                billing_city:
                  type: string
                  description: Optional City Name for billing.
                billing_state:
                  type: string
                  description: Optional Name of state for billing.
                billing_zip:
                  type: integer # Doc says Number
                  description: Optional Zip code.
                billing_country:
                  type: integer # Doc says Number (Country ID)
                  description: Optional Country code ID.
                include_shipping:
                  type: boolean # Doc says boolean
                  description: Optional. Set true to include/show Shipping Address. Default false.
                show_shipping_on_invoice:
                  type: boolean # Doc says boolean
                  description: Optional. Shows shipping details in invoice PDF.
                shipping_street:
                  type: string
                  description: Optional Address of shipping (required if include_shipping=true?).
                shipping_city:
                  type: string
                  description: Optional City name for shipping.
                shipping_state:
                  type: string
                  description: Optional Name of state for shipping.
                shipping_zip:
                  type: integer # Doc says Number
                  description: Optional Zip code for shipping.
                shipping_country:
                  type: integer # Doc says Number (Country ID)
                  description: Optional Country code ID for shipping.
                duedate:
                  type: string
                  format: date
                  description: Optional Due date for Invoice (YYYY-MM-DD).
                cancel_overdue_reminders:
                  type: boolean # Doc says boolean
                  description: Optional. Prevent sending overdue reminders for invoice.
                tags:
                  type: string
                  description: Optional comma-separated TAGS.
                sale_agent:
                  type: integer # Doc says Number (Staff ID)
                  description: Optional Sale Agent ID.
                recurring: # Doc says String ('1' to '12' or 'custom')
                  type: string
                  description: Optional. Set recurring frequency ('1' to '12' for months, or 'custom').
                  enum: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'custom']
                discount_type:
                  type: string
                  description: Optional discount type ('before_tax' or 'after_tax').
                  enum: [before_tax, after_tax]
                discount_percent: # Not listed but needed?
                   type: number
                   format: float
                discount_total: # Not listed but needed?
                   type: number
                   format: float
                repeat_every_custom:
                  type: integer # Doc says Number
                  description: Optional. Required if recurring is 'custom'. Interval number.
                repeat_type_custom:
                  type: string
                  description: Optional. Required if recurring is 'custom'. Interval unit ('day', 'week', 'month', 'year').
                  enum: [day, week, month, year]
                cycles:
                  type: integer # Doc says Number
                  description: Optional. Number of recurring cycles (0 for infinite).
                adminnote:
                  type: string
                  description: Optional notes by admin.
                # removed_items: # Only relevant for PUT
                clientnote:
                  type: string
                  description: Optional client notes.
                terms:
                  type: string
                  description: Optional Terms.
                adjustment: # Not listed but exists in GET
                   type: number
                   format: float
                custom_fields:
                  type: object
                  description: "Custom fields data. Key format: custom_fields[invoice][field_id]. See Custom Fields documentation."
                  additionalProperties: true
      responses:
        '200': # Doc shows 200 OK for success
          description: Invoice Added Successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse'
              example:
                status: true
                message: Invoice Added Successfully
        '400': # Doc shows 404 but 400 is better for validation errors
          description: Invoice add failed (validation errors).
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
                # Could be ErrorResponseDetailed
              example:
                status: false
                message: Invoice Add Fail # Or specific error

  /invoices/{id}:
    get:
      tags:
        - Invoices
      summary: Request invoice information
      description: Retrieve information for a specific invoice by its ID.
      operationId: getInvoiceById
      parameters:
        - name: id
          in: path
          required: true
          description: Invoice unique ID.
          schema:
            type: integer # Assuming numeric ID
            format: int64
      responses:
        '200':
          description: Invoice information retrieved successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Invoice'
              example: # Example from documentation
                id: "2"
                sent: "0"
                # ... (full example structure from Invoice schema) ...
                items:
                 - id: "2"
                   rel_id: "2"
                   rel_type": "invoice"
                   description: "12MP Dual Camera with cover"
                   long_description: "The JBL Cinema SB110 is a hassle-free soundbar"
                   qty: "1.00"
                   rate: "5.00"
                   unit: ""
                   item_order: "1"
                client:
                  userid: "1"
                  company: "trueline"
                  # ... (full customer structure) ...
                payments: []
                scheduled_email: null
        '404':
          description: Invoice not found.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: No data were found

    put:
      tags:
        - Invoices
      summary: Update invoice
      description: Update an existing invoice's information.
      operationId: updateInvoice
      parameters:
        - name: id
          in: path
          required: true
          description: Invoice unique ID to update.
          schema:
            type: integer
            format: int64
      requestBody:
        description: Invoice data to update. Uses multipart/form-data.
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required: # Assuming these remain mandatory
                - clientid
                - number
                - date
                - currency
                # - newitems # Optional for adding more
                # - items # Optional for updating existing
                - subtotal
                - total
                - billing_street
                - allowed_payment_modes
              properties:
                # Same properties as POST, mostly optional
                clientid:
                  type: integer
                number:
                  type: integer
                date:
                  type: string
                  format: date
                currency:
                  type: integer
                newitems:
                  type: array
                  items:
                     $ref: '#/components/schemas/InvoiceItem'
                  description: Optional. New Items to be added.
                items:
                  type: array
                  items:
                    type: object # Existing items need 'id'
                    properties:
                       id:
                         type: integer
                       # ... other item fields ...
                  description: Optional. Existing items to update. Include item line ID.
                removed_items:
                  type: array
                  items:
                    type: integer # Array of item line IDs
                  description: Optional. Items to be removed (Array of item line IDs).
                subtotal:
                  type: number
                  format: float
                total:
                  type: number
                  format: float
                billing_street:
                  type: string
                allowed_payment_modes:
                  type: array
                  items:
                    type: integer
                billing_city:
                  type: string
                billing_state:
                  type: string
                billing_zip:
                  type: integer
                billing_country:
                  type: integer
                include_shipping:
                  type: boolean
                show_shipping_on_invoice:
                  type: boolean
                shipping_street:
                  type: string
                shipping_city:
                  type: string
                shipping_state:
                  type: string
                shipping_zip:
                  type: integer
                shipping_country:
                  type: integer
                duedate:
                  type: string
                  format: date
                cancel_overdue_reminders:
                  type: boolean
                tags:
                  type: string
                sale_agent:
                  type: integer
                recurring:
                  type: string
                  enum: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'custom']
                discount_type:
                  type: string
                  enum: [before_tax, after_tax]
                discount_percent:
                   type: number
                   format: float
                discount_total:
                   type: number
                   format: float
                repeat_every_custom:
                  type: integer
                repeat_type_custom:
                  type: string
                  enum: [day, week, month, year]
                cycles:
                  type: integer
                adminnote:
                  type: string
                clientnote:
                  type: string
                terms:
                  type: string
                adjustment:
                   type: number
                   format: float
                custom_fields:
                  type: object
                  description: "Custom fields data. Key format: custom_fields[invoice][field_id]. See Custom Fields documentation."
                  additionalProperties: true
      responses:
        '200':
          description: Invoice Updated Successfully. (Doc response says status: false? Assuming typo).
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse'
              example:
                status: true # Corrected from false in docs example
                message: Invoice Updated Successfully
        '400': # Doc shows 404 but 400 is better for validation/update fail
          description: Invoice update failed (e.g., validation error, number exists).
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: Invoice Update Fail # Or "The Invoice number is already in use"
        '404':
           description: Invoice not found.
           content:
             application/json:
               schema:
                 $ref: '#/components/schemas/ErrorResponseSimple'

    delete:
      tags:
        - Invoices
      summary: Delete invoice
      description: Delete a specific invoice by its ID.
      operationId: deleteInvoice
      parameters:
        - name: id
          in: path
          required: true
          description: Invoice unique ID to delete.
          schema:
            type: integer
            format: int64
      responses:
        '200':
          description: Invoice deleted successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse'
              example:
                status: true
                message: Invoice Deleted Successfully
        '404':
          description: Invoice not found or delete failed.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: Invoice Delete Fail

  /invoices/search/{keysearch}:
    get:
      tags:
        - Invoices
      summary: Search invoice information
      description: Search for invoices based on keywords.
      operationId: searchInvoices
      parameters:
        - name: keysearch
          in: path
          required: true
          description: Search Keywords.
          schema:
            type: string
      responses:
        '200':
          description: Search results matching the keywords. Includes joined customer data.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Invoice' # Includes joined customer data
              example: # Example from documentation (assuming array response)
                - id: "19"
                  sent: "0"
                  # ... (full example structure from Invoice schema) ...
                  userid: "3"
                  company: "xyz"
                  # ... other customer fields ...
                  invoiceid: "19" # Duplicate ID?
        '404':
          description: No invoices found matching the search criteria.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: No Data Were Found

  # Leads
  /leads:
    get:
      tags:
        - Leads
      summary: Request all Leads
      description: Retrieve a list of all leads accessible to the token holder.
      operationId: listLeads
      responses:
        '200':
          description: A list of leads.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Lead'
              # Example provided is for single lead, assuming list returns array
        '404':
          description: No leads found.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: No data were found
    post:
      tags:
        - Leads
      summary: Add New Lead
      description: Create a new lead record.
      operationId: createLead
      requestBody:
        description: Lead data to add. Uses multipart/form-data.
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required:
                - source
                - status
                - name
                - assigned
              properties:
                source:
                  type: integer # Doc says String, but likely Source ID (numeric)
                  description: Mandatory Lead source ID.
                status:
                  type: integer # Doc says String, but likely Status ID (numeric)
                  description: Mandatory Lead Status ID.
                name:
                  type: string
                  description: Mandatory Lead Name.
                assigned:
                  type: integer # Doc says String, but likely Staff ID (numeric)
                  description: Mandatory Lead assigned staff ID.
                client_id:
                  type: integer # Doc says String, Customer ID?
                  description: Optional Customer ID if lead is from existing customer.
                tags:
                  type: string
                  description: Optional comma-separated tags.
                contact: # Contact Name? Not Contact ID?
                  type: string
                  description: Optional Lead contact person name.
                title:
                  type: string
                  description: Optional Position of the contact.
                email:
                  type: string
                  format: email
                  description: Optional Lead Email Address.
                website:
                  type: string
                  format: uri
                  description: Optional Lead Website.
                phonenumber:
                  type: string
                  description: Optional Lead Phone.
                company:
                  type: string
                  description: Optional Lead company.
                address:
                  type: string
                  description: Optional Lead address.
                city:
                  type: string
                  description: Optional Lead City.
                zip:
                  type: string
                  description: Optional Zip code.
                state:
                  type: string
                  description: Optional Lead state.
                country:
                  type: integer # Doc says String, likely Country ID (numeric)
                  description: Optional Lead Country ID.
                default_language:
                  type: string
                  description: Optional Lead Default Language.
                description:
                  type: string
                  description: Optional Lead description.
                custom_contact_date: # Field name unclear. "Lead From Customer"? Date field?
                  type: string
                  format: date # Assuming date
                  description: Optional custom contact date (YYYY-MM-DD).
                contacted_today:
                  type: integer # Doc says String, likely 0 or 1
                  enum: [0, 1]
                  description: Optional flag indicating if contacted today (1 for yes).
                is_public:
                  type: integer # Doc says String, likely 0 or 1
                  enum: [0, 1]
                  description: Optional flag for public visibility (1 for public).
                custom_fields:
                  type: object
                  description: "Custom fields data. Key format: custom_fields[leads][field_id]. See Custom Fields documentation."
                  additionalProperties: true
      responses:
        '200': # Doc shows 200 OK for success
          description: Lead added successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse'
              example:
                status: true
                message: Lead add successful.
        '400': # Doc shows 404 but 400 is better for add fail
          description: Lead add failed (e.g., validation error).
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: Lead add fail.

  /leads/{id}:
    get:
      tags:
        - Leads
      summary: Request Lead information
      description: Retrieve information for a specific lead by its ID.
      operationId: getLeadById
      parameters:
        - name: id
          in: path
          required: true
          description: Lead unique ID.
          schema:
            type: integer # Assuming numeric ID
            format: int64
      responses:
        '200':
          description: Lead information retrieved successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Lead'
              example: # Example from documentation
                id: "17"
                hash: "c6e938f8b7a40b1bcfd98dc04f6eeee0-..."
                name: "Lead name"
                contact: ""
                title: ""
                company: "Themesic Interactive"
                description: ""
                country": "243"
                # zip: null # Duplicate zip key in example?
                city: "London"
                zip: "WC13KJ"
                state: "London"
                address: "1a The Alexander Suite Silk Point"
                assigned: "5"
                dateadded: "2019-07-18 08:59:28"
                from_form_id: "0"
                status: "0" # Needs mapping to status name
                source: "4" # Needs mapping to source name
                # ... other fields from Lead schema ...
        '404':
          description: Lead not found.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: No data were found

    put:
      tags:
        - Leads
      summary: Update a lead
      description: Update an existing lead's information.
      operationId: updateLead
      parameters:
        - name: id
          in: path
          required: true
          description: Lead unique ID to update.
          schema:
            type: integer
            format: int64
      requestBody:
        description: Lead data to update. Uses multipart/form-data. Fields optional.
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required: # Assuming these remain mandatory for update
                - source
                - status
                - name
                - assigned
              properties:
                # Same properties as POST, mostly optional
                source:
                  type: integer
                status:
                  type: integer
                name:
                  type: string
                assigned:
                  type: integer
                client_id:
                  type: integer
                tags:
                  type: string
                contact:
                  type: string
                title:
                  type: string
                email:
                  type: string
                  format: email
                website:
                  type: string
                  format: uri
                phonenumber:
                  type: string
                company:
                  type: string
                address:
                  type: string
                city:
                  type: string
                zip:
                  type: string
                state:
                  type: string
                country:
                  type: integer
                default_language:
                  type: string
                description:
                  type: string
                lastcontact: # Not in POST, update only?
                  type: string
                  format: date-time # Assuming date-time
                  description: Optional Lead Last Contact date/time.
                is_public:
                  type: integer
                  enum: [0, 1]
                custom_fields:
                  type: object
                  description: "Custom fields data. Key format: custom_fields[leads][field_id]. See Custom Fields documentation."
                  additionalProperties: true
      responses:
        '200':
          description: Lead updated successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse'
              example:
                status: true
                message: Lead Update Successful.
        '400': # Doc shows 404 but 400 is better for update fail
          description: Lead update failed (e.g., validation error).
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: Lead Update Fail.
        '404':
           description: Lead not found.
           content:
             application/json:
               schema:
                 $ref: '#/components/schemas/ErrorResponseSimple'

  # Non-standard DELETE path from documentation
  /delete/leads/{id}:
    delete:
      tags:
        - Leads
      summary: Delete a Lead
      description: Delete a specific lead by their ID. (Note: Non-standard path)
      operationId: deleteLead
      parameters:
        - name: id
          in: path
          required: true
          description: Lead unique ID to delete.
          schema:
            type: integer # Assuming numeric ID
            format: int64
      responses:
        '200':
          description: Lead deleted successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse' # Doc uses 'status: string' ? Assuming boolean
              example:
                status: true # Changed from string "true"
                message: Lead Delete Successful.
        '404':
          description: Lead not found or delete failed.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: Lead Delete Fail.

  /leads/search/{keysearch}:
    get:
      tags:
        - Leads
      summary: Search Lead Information
      description: Search for leads based on keywords.
      operationId: searchLeads
      parameters:
        - name: keysearch
          in: path
          required: true
          description: Search Keywords.
          schema:
            type: string
      responses:
        '200':
          description: Search results matching the keywords.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Lead'
              # Example provided is for single lead, assuming list returns array
        '404':
          description: No leads found matching the search criteria.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: No data were found

  # Milestones
  /milestones:
    post:
      tags:
        - Milestones
        - Projects # Related to projects
      summary: Add New Milestone
      description: Create a new milestone for a project.
      operationId: createMilestone
      requestBody:
        description: Milestone data to add. Uses multipart/form-data.
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required:
                - project_id
                - name
                - due_date
              properties:
                project_id:
                  type: integer # Doc says String, but likely Project ID (numeric)
                  description: Mandatory project ID.
                name:
                  type: string
                  description: Mandatory Milestone Name.
                due_date:
                  type: string
                  format: date
                  description: Mandatory Milestone Due date (YYYY-MM-DD).
                description:
                  type: string
                  description: Optional Milestone Description.
                description_visible_to_customer:
                  type: integer # Doc says String, likely 0 or 1
                  enum: [0, 1]
                  description: Show description to customer (1 for yes, 0 for no).
                milestone_order:
                  type: integer # Doc says String, likely numeric order
                  description: Optional Milestone Order.
                color: # Not in POST params but present in GET
                  type: string
                  description: Optional color hex code for the milestone.
                custom_fields:
                  type: object
                  description: "Custom fields data. Key format: custom_fields[milestones][field_id]. See Custom Fields documentation."
                  additionalProperties: true
      responses:
        '200': # Doc shows 200 OK for success
          description: Milestone added successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse' # Doc uses 'status: string'? Assuming boolean
              example:
                status: true # Changed from string "true"
                message: Milestone add successful.
        '400': # Doc shows 404 but 400 is better for add fail
          description: Milestone add failed (e.g., validation error).
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple' # Doc uses 'status: string'? Assuming boolean
              example:
                status: false # Changed from string "false"
                message: Milestone add fail.

  /milestones/{id}:
    get:
      tags:
        - Milestones
        - Projects
      summary: Request Milestones information
      description: Retrieve information for a specific milestone by its ID.
      operationId: getMilestoneById
      parameters:
        - name: id
          in: path
          required: true
          description: Milestone unique ID.
          schema:
            type: integer # Assuming numeric ID
            format: int64
      responses:
        '200':
          description: Milestone information retrieved successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Milestone'
              example: # Example from documentation
                id: "5"
                name: "MIlestone A"
                description: ""
                description_visible_to_customer: "0"
                due_date: "2019-09-30"
                project_id: "2"
                color: null
                milestone_order: "1"
                datecreated: "2019-07-19"
                total_tasks: "0"
                total_finished_tasks: "0"
        '404':
          description: Milestone not found.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: No data were found

    put:
      tags:
        - Milestones
        - Projects
      summary: Update a Milestone
      description: Update an existing milestone's information.
      operationId: updateMilestone
      parameters:
        - name: id
          in: path
          required: true
          description: Milestone unique ID to update.
          schema:
            type: integer
            format: int64
      requestBody:
        description: Milestone data to update. Uses multipart/form-data. Fields optional.
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required: # Assuming these remain mandatory for update
                - project_id
                - name
                - due_date
              properties:
                # Same properties as POST, mostly optional
                project_id:
                  type: integer
                name:
                  type: string
                due_date:
                  type: string
                  format: date
                description:
                  type: string
                description_visible_to_customer:
                  type: integer
                  enum: [0, 1]
                milestone_order:
                  type: integer
                color:
                  type: string
                custom_fields:
                  type: object
                  description: "Custom fields data. Key format: custom_fields[milestones][field_id]. See Custom Fields documentation."
                  additionalProperties: true
      responses:
        '200':
          description: Milestone updated successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse' # Doc uses 'status: string'? Assuming boolean
              example:
                status: true # Changed from string "true"
                message: Milestone Update Successful.
        '400': # Doc shows 404 but 400 is better for update fail
          description: Milestone update failed (e.g., validation error).
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple' # Doc uses 'status: string'? Assuming boolean
              example:
                status: false # Changed from string "false"
                message: Milestone Update Fail.
        '404':
           description: Milestone not found.
           content:
             application/json:
               schema:
                 $ref: '#/components/schemas/ErrorResponseSimple'

  # Non-standard DELETE path from documentation
  /delete/milestones/{id}:
    delete:
      tags:
        - Milestones
        - Projects
      summary: Delete a Milestone
      description: Delete a specific milestone by their ID. (Note: Non-standard path)
      operationId: deleteMilestone
      parameters:
        - name: id
          in: path
          required: true
          description: Milestone unique ID to delete.
          schema:
            type: integer # Assuming numeric ID
            format: int64
      responses:
        '200':
          description: Milestone deleted successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse' # Doc uses 'status: string'? Assuming boolean
              example:
                status: true # Changed from string "true"
                message: Milestone Delete Successful.
        '404':
          description: Milestone not found or delete failed.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple' # Doc uses 'status: string'? Assuming boolean
              example:
                status: false # Changed from string "false"
                message: Milestone Delete Fail.

  /milestones/search/{keysearch}:
    get:
      tags:
        - Milestones
        - Projects
      summary: Search Milestones Information
      description: Search for milestones based on keywords.
      operationId: searchMilestones
      parameters:
        - name: keysearch
          in: path
          required: true
          description: Search Keywords.
          schema:
            type: string
      responses:
        '200':
          description: Search results matching the keywords.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Milestone'
              example: # Example from documentation (assuming array response)
                - id: "5"
                  name: "MIlestone A"
                  description: ""
                  description_visible_to_customer: "0"
                  due_date: "2019-09-30"
                  project_id: "2"
                  color: null
                  milestone_order: "1"
                  datecreated: "2019-07-19"
                  total_tasks: "0"
                  total_finished_tasks: "0"
        '404':
          description: No milestones found matching the search criteria.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: No data were found

  # Payment Modes (Common Data)
  /common/payment_mode:
    get:
      tags:
        - Payment Modes
        - Common Data
      summary: Request Payment Modes
      description: Retrieve a list of all available payment modes.
      operationId: listPaymentModes
      responses:
        '200':
          description: A list of payment modes.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/PaymentMode'
              example: # Example from documentation
                - id: "1"
                  name: "Bank"
                  description: null
                  show_on_pdf: "0"
                  invoices_only: "0"
                  expenses_only: "0"
                  selected_by_default: "1"
                  active: "1"
        '404':
          description: No payment modes found.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: No data were found

  # Payments
  /payments:
    post:
      tags:
        - Payments
        - Invoices # Related to invoices
      summary: Add New Payment
      description: Record a new payment against an invoice.
      operationId: createPayment
      requestBody:
        description: Payment data to add. Uses multipart/form-data.
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required:
                - invoiceid
                - amount
                - paymentmode
              properties:
                invoiceid:
                  type: integer # Doc says String, likely Invoice ID (numeric)
                  description: Mandatory Invoice ID associated with the payment.
                amount:
                  type: number # Doc says String, but should be numeric amount
                  format: float
                  description: Mandatory Payment amount.
                paymentmode:
                  type: integer # Doc says String, likely Payment Mode ID (numeric)
                  description: Mandatory Payment mode ID.
                date: # Not listed but essential
                  type: string
                  format: date
                  description: Mandatory Payment Date (YYYY-MM-DD).
                paymentmethod:
                  type: string
                  description: Optional Payment method details (e.g., card type, check number).
                note:
                  type: string
                  description: Optional Additional payment note.
                transactionid:
                  type: string
                  description: Optional Transaction ID from payment gateway.
                custom_fields:
                  type: object
                  description: "Custom fields data. Key format: custom_fields[payments][field_id]. See Custom Fields documentation."
                  additionalProperties: true
      responses:
        '200': # Doc shows 200 OK for success
          description: Payment added successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaymentSuccessMessageResponse' # Uses 'paymentmode' key
              example:
                paymentmode: true
                message: Payment add successful.
        '400': # Doc shows 404 but 400 is better for add fail
          description: Payment add failed (e.g., validation error, invalid invoice ID).
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaymentErrorResponse' # Uses 'paymentmode' key
              example:
                paymentmode: false
                message: Payment add fail.

  # Path includes optional parameter logic
  /payments/{id}:
    get:
      tags:
        - Payments
      summary: List Payments or Get Specific Payment
      description: |
        Retrieve payment information.
        - If `id` is provided, retrieves a specific payment record.
        - If `id` is *not* provided (or set to 0), lists all payment records accessible.
        *Note: Path uses `:id` but description implies it's optional (`payment_id`). Assumes GET `/payments` for list and GET `/payments/{id}` for specific.* This spec follows GET `/payments/{id}` for specific payment. List All needs a separate `/payments` path.
      operationId: getPaymentById
      parameters:
        - name: id # Doc param name is 'payment_id', path is ':id'. Using 'id'.
          in: path
          required: true
          description: Payment unique ID to retrieve.
          schema:
            type: integer # Assuming numeric ID
            format: int64
      responses:
        '200':
          description: Payment information retrieved successfully.
          content:
            application/json:
              schema:
                  $ref: '#/components/schemas/Payment' # Single Payment object expected
          # Example in docs is for List All, not single Get
        '404':
          description: Payment not found.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaymentErrorResponse' # Uses 'paymentmode' key
              example:
                paymentmode: false
                message: No data were found

  # Need separate path for List All based on doc description
  /payments: # Assuming standard list path
    get:
      tags:
        - Payments
      summary: List all Payments
      description: Retrieve a list of all payment records accessible to the token holder.
      operationId: listPayments
      responses:
        '200':
          description: A list of payment records. Includes joined payment mode details.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Payment'
              example: # Example from documentation
                - id: "3"
                  invoiceid: "7"
                  amount: "1000.00"
                  paymentmode: "3"
                  paymentmethod: ""
                  date: "2020-06-08"
                  daterecorded: "2020-06-08 20:29:54"
                  note: ""
                  transactionid: "000355795931"
                  # Joined Payment Mode Data (Inconsistent key 'invoiceid' used in example, assuming 'name')
                  name: "UPI" # Assumed key
                  description: ""
                  show_on_pdf: "0"
                  invoices_only: "0"
                  expenses_only: "0"
                  selected_by_default: "0"
                  active: "1"
                  paymentid: "1" # Duplicate ID?
                # ... other payment examples ...
        '404':
          description: No payments found.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaymentErrorResponse' # Uses 'paymentmode' key
              example:
                paymentmode: false
                message: No data were found

  /payments/search/{keysearch}:
    get:
      tags:
        - Payments
      summary: Search Payments Information
      description: Search for payments based on keywords (e.g., transaction ID, amount, invoice number).
      operationId: searchPayments
      parameters:
        - name: keysearch
          in: path
          required: true
          description: Search Keywords.
          schema:
            type: string
      responses:
        '200':
          description: Search results matching the keywords.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Payment'
              example: # Example from documentation (assuming array response)
                - id: "3"
                  invoiceid: "14" # Different from List example?
                  amount: "8.00"
                  paymentmode: "2" # Different from List example?
                  paymentmethod: ""
                  date: "2020-07-04"
                  daterecorded: "2020-07-04 15:47:30"
                  note": ""
                  transactionid: ""
                  # ... potentially joined data ...
        '404':
          description: No payments found matching the search criteria.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaymentErrorResponse' # Uses 'paymentmode' key
              example:
                paymentmode: false
                message: No data were found

  # Projects
  /projects:
    post:
      tags:
        - Projects
      summary: Add New Project
      description: Create a new project record.
      operationId: createProject
      requestBody:
        description: Project data to add. Uses multipart/form-data.
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required:
                - name
                - rel_type
                - clientid # Doc says 'Related ID', assuming same as clientid
                - billing_type
                - start_date
                - status
              properties:
                name:
                  type: string
                  description: Mandatory Project Name.
                rel_type:
                  type: string
                  description: Mandatory Project Related type.
                  enum: [lead, customer, internal]
                clientid:
                  type: integer # Doc says Number (Lead ID or Customer ID)
                  description: Mandatory Related ID (Lead or Customer ID, 0 for internal?).
                billing_type:
                  type: integer # Doc says Number (Billing Type ID)
                  description: Mandatory Billing Type ID (e.g., 1 Fixed Rate, 2 Project Hours, 3 Task Hours).
                start_date:
                  type: string
                  format: date
                  description: Mandatory Project Start Date (YYYY-MM-DD).
                status:
                  type: integer # Doc says Number (Status ID)
                  description: Mandatory Project Status ID (e.g., 1 Not Started, 2 In Progress, etc.).
                progress_from_tasks:
                  type: integer # Doc says String 'on' or 'off', likely 1 or 0
                  enum: [0, 1]
                  description: Optional. Calculate progress from tasks (1 for on, 0 for off).
                project_cost:
                  type: number # Doc says String, likely decimal
                  format: float
                  description: Optional Project Cost (for fixed rate billing type).
                progress:
                  type: integer # Doc says String, likely percentage 0-100
                  description: Optional manual project progress percentage (0-100). Used if progress_from_tasks is off.
                  minimum: 0
                  maximum: 100
                project_rate_per_hour:
                  type: number # Doc says String, likely decimal
                  format: float
                  description: Optional project rate per hour (for project hours billing type).
                estimated_hours:
                  type: number # Doc says String, likely decimal
                  format: float
                  description: Optional Project estimated hours.
                project_members:
                  type: array
                  items:
                    type: integer # Array of Staff IDs
                  description: Optional Project members (Array of Staff IDs).
                deadline:
                  type: string
                  format: date
                  description: Optional Project deadline (YYYY-MM-DD).
                tags:
                  type: string
                  description: Optional comma-separated Project tags.
                description:
                  type: string
                  description: Optional Project description (HTML?).
                send_project_created_email: # Not in docs, but common option
                   type: integer
                   enum: [0, 1]
                   description: Optional. Send project created email to customer contacts (1 for yes).
                custom_fields:
                  type: object
                  description: "Custom fields data. Key format: custom_fields[projects][field_id]. See Custom Fields documentation."
                  additionalProperties: true
      responses:
        '200': # Doc shows 200 OK for success
          description: Project added successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse'
              example:
                status: true
                message: Project add successful.
        '400': # Doc shows 404 but 400 is better for add fail
          description: Project add failed (e.g., validation error).
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: Project add fail.

  /projects/{id}:
    get:
      tags:
        - Projects
      summary: Request project information
      description: Retrieve information for a specific project by its ID.
      operationId: getProjectById
      parameters:
        - name: id
          in: path
          required: true
          description: Project unique ID.
          schema:
            type: integer # Assuming numeric ID
            format: int64
      responses:
        '200':
          description: Project information retrieved successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Project'
              example: # Example from documentation
                 id: "28"
                 name: "Test1"
                 description: null
                 status: "1"
                 clientid: "11" # Lead/Customer ID
                 billing_type: "3"
                 start_date: "2019-04-19"
                 deadline: "2019-08-30"
                 project_created: "2019-07-16" # Renamed from customer_created
                 date_finished: null
                 progress: "0"
                 progress_from_tasks: "1"
                 project_cost: "0.00" # Renamed from customer_cost
                 project_rate_per_hour: "0.00" # Renamed from customer_rate_per_hour
                 estimated_hours: "0.00"
                 addedfrom": "5"
                 rel_type: "lead" # Corrected from 'customer' in example text
                 # ... potentially other fields ...
        '404':
          description: Project not found.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: No data were found

    put:
      tags:
        - Projects
      summary: Update a project
      description: Update an existing project's information.
      operationId: updateProject
      parameters:
        - name: id
          in: path
          required: true
          description: Project unique ID to update.
          schema:
            type: integer
            format: int64
      requestBody:
        description: Project data to update. Uses multipart/form-data. Fields optional.
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required: # Assuming these remain mandatory for update?
                - name
                - rel_type
                - clientid
                - billing_type
                - start_date
                - status
              properties:
                # Same properties as POST, mostly optional
                name:
                  type: string
                rel_type:
                  type: string
                  enum: [lead, customer, internal]
                clientid:
                  type: integer
                billing_type:
                  type: integer
                start_date:
                  type: string
                  format: date
                status:
                  type: integer
                progress_from_tasks:
                  type: integer
                  enum: [0, 1]
                project_cost:
                  type: number
                  format: float
                progress:
                  type: integer
                  minimum: 0
                  maximum: 100
                project_rate_per_hour:
                  type: number
                  format: float
                estimated_hours:
                  type: number
                  format: float
                project_members:
                  type: array
                  items:
                    type: integer
                  description: Replaces existing members. Send empty array to remove all.
                deadline:
                  type: string
                  format: date
                tags:
                  type: string
                description:
                  type: string
                custom_fields:
                  type: object
                  description: "Custom fields data. Key format: custom_fields[projects][field_id]. See Custom Fields documentation."
                  additionalProperties: true
      responses:
        '200':
          description: Project updated successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse'
              example:
                status: true
                message: Project Update Successful.
        '400': # Doc shows 404 but 400 is better for update fail
          description: Project update failed (e.g., validation error).
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: Project Update Fail.
        '404':
           description: Project not found.
           content:
             application/json:
               schema:
                 $ref: '#/components/schemas/ErrorResponseSimple'

  # Non-standard DELETE path from documentation
  /delete/projects/{id}:
    delete:
      tags:
        - Projects
      summary: Delete a Project
      description: Delete a specific project by their ID. (Note: Non-standard path)
      operationId: deleteProject
      parameters:
        - name: id
          in: path
          required: true
          description: Project unique ID to delete.
          schema:
            type: integer # Assuming numeric ID
            format: int64
      responses:
        '200':
          description: Project deleted successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse'
              example:
                status: true
                message: Project Delete Successful.
        '404':
          description: Project not found or delete failed.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: Project Delete Fail.

  /projects/search/{keysearch}:
    get:
      tags:
        - Projects
      summary: Search Project Information
      description: Search for projects based on keywords.
      operationId: searchProjects
      parameters:
        - name: keysearch
          in: path
          required: true
          description: Search keywords.
          schema:
            type: string
      responses:
        '200':
          description: Search results matching the keywords.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Project'
              example: # Example from documentation (assuming array response)
                 - id: "28"
                   name: "Test1"
                   # ... (full example structure from Project schema) ...
        '404':
          description: No projects found matching the search criteria.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: No data were found

  # Proposals
  /proposals:
    get: # Doc path is /proposals but example GET is /proposals/{id}. Assuming /proposals lists all.
      tags:
        - Proposals
      summary: List all Proposals
      description: Retrieve a list of all proposals accessible to the token holder.
      operationId: listProposals
      responses:
        '200':
          description: A list of proposals.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Proposal'
              # No list example provided, only single get
        '404':
          description: No proposals found.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: No data were found
    post:
      tags:
        - Proposals
      summary: Add New Proposals
      description: Create a new proposal record.
      operationId: createProposal
      requestBody:
        description: Proposal data to add. Uses multipart/form-data.
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required:
                - subject
                - related # Param name in doc is 'Related', using 'related'
                - rel_id
                - proposal_to
                - date
                - currency
                - email
                - newitems
              properties:
                subject:
                  type: string
                  description: Mandatory Proposal Subject Name.
                related: # Changed from 'Related'
                  type: string
                  description: Mandatory Proposal Related type.
                  enum: [lead, customer]
                rel_id:
                  type: integer # Doc says Number (Lead or Customer ID)
                  description: Mandatory Related ID (Lead or Customer ID).
                proposal_to:
                  type: string
                  description: Mandatory Lead / Customer name (or company?) this proposal is addressed to.
                date:
                  type: string
                  format: date
                  description: Mandatory Proposal Start Date (YYYY-MM-DD).
                open_till:
                  type: string
                  format: date
                  description: Optional Proposal Open Till Date (YYYY-MM-DD).
                currency:
                  type: integer # Doc says string, but likely Currency ID (numeric)
                  description: Mandatory currency ID.
                discount_type:
                  type: string
                  description: Optional discount type ('before_tax' or 'after_tax'). Doc description mismatch.
                  enum: [before_tax, after_tax]
                status:
                  type: integer # Doc says string, likely Status ID (numeric)
                  description: Optional status ID (e.g., 1 Draft, 6 Accepted, etc.).
                assigned: # Changed from 'Assigned'
                  type: integer # Doc says string, likely Staff ID (numeric)
                  description: Optional Assignee staff ID.
                email: # Changed from 'Email'
                  type: string
                  format: email
                  description: Mandatory Email address of the recipient.
                phone: # Not in POST params but present in GET
                   type: string
                address: # Not in POST params but present in GET
                   type: string
                city: # Not in POST params but present in GET
                   type: string
                state: # Not in POST params but present in GET
                   type: string
                zip: # Not in POST params but present in GET
                   type: string
                country: # Not in POST params but present in GET
                   type: integer # Country ID
                newitems:
                  type: array
                  items:
                     $ref: '#/components/schemas/ProposalItem' # Define item structure
                  description: Mandatory New Items to be added. Array of item objects.
                allow_comments: # Not in POST params but present in GET
                   type: integer
                   enum: [0, 1]
                   description: Optional. Allow comments (1 for yes). Default 1?
                content: # Not in POST params but present in GET
                   type: string
                   description: Optional. Proposal content (HTML, uses merge fields like {proposal_items}).
                custom_fields:
                  type: object
                  description: "Custom fields data. Key format: custom_fields[proposal][field_id]. See Custom Fields documentation."
                  additionalProperties: true
      responses:
        '200': # Doc shows 200 OK for success
          description: Proposal added successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessMessageResponse'
              example:
                status: true
                message: Proposal add successful.
        '400': # Doc shows 404 but 400 is better for add fail
          description: Proposal add failed (e.g., validation error).
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseSimple'
              example:
                status: false
                message: Proposal add fail.

  /proposals/{id}: # Doc path is /proposals but param says id? Assuming /proposals/{id} for


  Okay, here is a list of all the API endpoints described in the documentation you provided, grouped by resource, along with their purpose:

(Note: All paths are relative to your base URL, e.g., https://yourdomain.com/api)

Customers

GET /customers - List all Customers.

POST /customers - Add a New Customer.

GET /customers/{id} - Request specific Customer Information by ID.

PUT /customers/{id} - Update a specific Customer by ID.

GET /customers/search/{keysearch} - Search for Customers using keywords.

DELETE /delete/customers/{id} - Delete a specific Customer by ID. (Note: Non-standard path)

Items (Invoice/Estimate Items)

GET /items/{id} - Request specific Item Information by ID.

GET /items/search/{keysearch} - Search for Items using keywords (typically for adding to invoices/estimates).

Subscriptions

GET /subscriptions - List all Subscriptions.

POST /subscriptions - Add a New Subscription.

GET /subscriptions/{id} - Request specific Subscription Information by ID.

PUT /subscriptions/{id} - Update a specific Subscription by ID.

DELETE /subscriptions/{id} - Delete a specific Subscription by ID.

Timesheets

GET /timesheets - List all Timesheets.

POST /timesheets - Add a New Timesheet.

GET /timesheets/{id} - Request specific Timesheet Information by ID.

PUT /timesheets/{id} - Update a specific Timesheet by ID.

DELETE /timesheets/{id} - Delete a specific Timesheet by ID.

Calendar Events

GET /calendar - List all Calendar Events.

POST /calendar - Create a new Calendar Event.

GET /calendar/{id} - Request specific Calendar Event Information by ID.

PUT /calendar/{id} - Update a specific Calendar Event by ID.

DELETE /calendar/{id} - Delete a specific Calendar Event by ID.

Contacts (Customer Contacts)

POST /contacts - Add a New Contact for a customer.

GET /contacts/{customer_id}/{contact_id} - List all Contacts for a Customer (if {contact_id} is omitted/0) or Get a Specific Contact by its ID (and customer ID).

PUT /contacts/{id} - Update specific Contact Information by ID.

GET /contacts/search/{keysearch} - Search for Contacts using keywords.

DELETE /delete/contacts/{id} - Delete a specific Contact by ID. (Note: Non-standard path)

Contracts

POST /contracts - Add a New Contract.

GET /contracts/{id} - Request specific Contract information by ID.

PUT /contracts/{id} - Update a specific Contract by ID.

DELETE /contracts/{id} - Delete a specific Contract by ID.

Credit Notes

POST /credit_notes - Add a New Credit Note.

GET /credit_notes/{id} - Request specific Credit Note information by ID.

PUT /credit_notes/{id} - Update a specific Credit Note by ID.

DELETE /credit_notes/{id} - Delete a specific Credit Note by ID.

GET /credit_notes/search/{keysearch} - Search for Credit Notes using keywords.

Custom Fields

GET /custom_fields/{FieldBelongsto}/{id} - Request definitions and values of Custom Fields for a specific record type and ID.

Estimates

POST /estimates - Add a New Estimate.

GET /estimates/{id} - Request specific Estimate information by ID.

PUT /estimates/{id} - Update a specific Estimate by ID.

DELETE /estimates/{id} - Delete a specific Estimate by ID.

GET /estimates/search/{keysearch} - Search for Estimates using keywords.

Expense Categories (Common Data)

GET /common/expense_category - List all Expense Categories.

Expenses

POST /expenses - Add a New Expense.

GET /expenses/{id} - Request specific Expense information by ID.

PUT /expenses/{id} - Update a specific Expense by ID.

DELETE /expenses/{id} - Delete a specific Expense by ID.

GET /expenses/search/{keysearch} - Search for Expenses using keywords.

Invoices

POST /invoices - Add a New Invoice.

GET /invoices/{id} - Request specific Invoice information by ID.

PUT /invoices/{id} - Update a specific Invoice by ID.

DELETE /invoices/{id} - Delete a specific Invoice by ID.

GET /invoices/search/{keysearch} - Search for Invoices using keywords.

Leads

GET /leads - List all Leads.

POST /leads - Add a New Lead.

GET /leads/{id} - Request specific Lead information by ID.

PUT /leads/{id} - Update a specific Lead by ID.

GET /leads/search/{keysearch} - Search for Leads using keywords.

DELETE /delete/leads/{id} - Delete a specific Lead by ID. (Note: Non-standard path)

Milestones (Project Milestones)

POST /milestones - Add a New Milestone to a project.

GET /milestones/{id} - Request specific Milestone information by ID.

PUT /milestones/{id} - Update a specific Milestone by ID.

GET /milestones/search/{keysearch} - Search for Milestones using keywords.

DELETE /delete/milestones/{id} - Delete a specific Milestone by ID. (Note: Non-standard path)

Payment Modes (Common Data)

GET /common/payment_mode - List all Payment Modes.

Payments

POST /payments - Add a New Payment record (usually for an invoice).

GET /payments - List all Payments. (Inferred standard path)

GET /payments/{id} - Request specific Payment information by ID.

GET /payments/search/{keysearch} - Search for Payments using keywords.

Projects

POST /projects - Add a New Project.

GET /projects/{id} - Request specific Project information by ID.

PUT /projects/{id} - Update a specific Project by ID.

GET /projects/search/{keysearch} - Search for Projects using keywords.

DELETE /delete/projects/{id} - Delete a specific Project by ID. (Note: Non-standard path)

Proposals

GET /proposals - List all Proposals. (Inferred standard path)

POST /proposals - Add a New Proposal.

GET /proposals/{id} - Request specific Proposal information by ID.

PUT /proposals/{id} - Update a specific Proposal by ID.

DELETE /proposals/{id} - Delete a specific Proposal by ID.

GET /proposals/search/{keysearch} - Search for Proposals using keywords.

Staff

POST /staffs - Add a New Staff member.

GET /staffs/{id} - Request specific Staff information by ID.

PUT /staffs/{id} - Update a specific Staff member by ID.

GET /staffs/search/{keysearch} - Search for Staff members using keywords.

DELETE /delete/staffs/{id} - Delete a specific Staff member by ID. (Note: Non-standard path)

Tasks

POST /tasks - Add a New Task.

GET /tasks/{id} - Request specific Task information by ID.

PUT /tasks/{id} - Update a specific Task by ID.

GET /tasks/search/{keysearch} - Search for Tasks using keywords.

DELETE /delete/tasks/{id} - Delete a specific Task by ID. (Note: Non-standard path)

Taxes (Common Data)

GET /common/tax_data - List all Taxes.

Tickets (Support Tickets)

POST /tickets - Add a New Ticket.

GET /tickets/{id} - Request specific Ticket information by ID.

PUT /tickets/{id} - Update a specific Ticket by ID.

GET /tickets/search/{keysearch} - Search for Tickets using keywords.

DELETE /delete/tickets/{id} - Delete a specific Ticket by ID. (Note: Non-standard path)