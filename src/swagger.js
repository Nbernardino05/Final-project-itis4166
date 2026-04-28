export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Roommate Management API',
    version: '1.0.0',
    description:
      'Backend service for managing shared living responsibilities — chores, expenses, and household membership.',
  },
  servers: [{ url: '/api', description: 'API server' }],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste the JWT token returned from /auth/login or /auth/signup',
      },
    },
    schemas: {
      AuthResponse: {
        type: 'object',
        properties: {
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          user: { $ref: '#/components/schemas/UserProfile' },
        },
      },
      UserProfile: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Nina Bernardino' },
          email: { type: 'string', example: 'nina@example.com' },
          role: { type: 'string', enum: ['admin', 'member'], example: 'admin' },
          householdId: { type: 'integer', nullable: true, example: 1 },
        },
      },
      Household: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Arcadia House' },
        },
      },
      HouseholdWithCount: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Arcadia House' },
          memberCount: { type: 'integer', example: 3 },
        },
      },
      HouseholdWithMembers: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Arcadia House' },
          members: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'integer', example: 1 },
                name: { type: 'string', example: 'Nina Bernardino' },
                role: { type: 'string', enum: ['admin', 'member'] },
              },
            },
          },
        },
      },
      Chore: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Vacuum living room' },
          status: { type: 'boolean', example: false },
          assignedTo: {
            nullable: true,
            type: 'object',
            properties: {
              id: { type: 'integer', example: 2 },
              name: { type: 'string', example: 'Alexis Pearson' },
            },
          },
          householdId: { type: 'integer', example: 1 },
        },
      },
      Expense: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Groceries' },
          cost: { type: 'number', example: 90 },
          createdBy: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              name: { type: 'string', example: 'Nina Bernardino' },
            },
          },
          createdAt: { type: 'string', format: 'date', example: '2025-06-01' },
          householdId: { type: 'integer', example: 1 },
          splitAmount: { type: 'number', example: 30 },
          memberCount: { type: 'integer', example: 3 },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Descriptive error message' },
        },
      },
    },
  },
  paths: {
    '/auth/signup': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        description: 'Creates a new account and returns a signed JWT.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Nina Bernardino' },
                  email: { type: 'string', example: 'nina@example.com' },
                  password: { type: 'string', example: 'Password123!' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User created',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } },
            },
          },
          400: { description: 'Missing or invalid fields', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          409: { description: 'Email already registered', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        description: 'Authenticate with email and password. Returns a signed JWT.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'nina@example.com' },
                  password: { type: 'string', example: 'Password123!' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          400: { description: 'Missing email or password', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/households': {
      post: {
        tags: ['Households'],
        summary: 'Create a household',
        description: 'Creates a new household. The authenticated user becomes its admin.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: { name: { type: 'string', example: 'Arcadia House' } },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Household created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Household' } } },
          },
          400: { description: 'Missing name', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Not authenticated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          409: { description: 'User already belongs to a household', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      get: {
        tags: ['Households'],
        summary: 'List households',
        description: 'Admins see all households. Regular members see only their own.',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'List of households',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/HouseholdWithCount' } },
              },
            },
          },
          401: { description: 'Not authenticated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/households/{id}': {
      get: {
        tags: ['Households'],
        summary: 'Get a household',
        description: 'Returns household details including its member list. Only accessible by members of the household.',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1 }],
        responses: {
          200: {
            description: 'Household details',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/HouseholdWithMembers' } } },
          },
          400: { description: 'ID is not a positive integer', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Not authenticated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Not a member of this household', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Household not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      put: {
        tags: ['Households'],
        summary: 'Update a household',
        description: 'Updates the household name. Household admin only.',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1 }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: { name: { type: 'string', example: 'Arcadia Home (Updated)' } },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Household updated',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Household' } } },
          },
          400: { description: 'Missing or invalid name', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Not authenticated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Not the household admin', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Household not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        tags: ['Households'],
        summary: 'Delete a household',
        description: 'Deletes the household and all its chores/expenses. Members are unassigned. Household admin only.',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1 }],
        responses: {
          200: {
            description: 'Household deleted',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Household' } } },
          },
          400: { description: 'Invalid ID', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Not authenticated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Not the household admin', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Household not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/households/{householdId}/chores': {
      post: {
        tags: ['Chores'],
        summary: 'Create a chore',
        description: 'Creates a new chore for the household. If assignedTo is provided, the user must be a household member.',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'householdId', in: 'path', required: true, schema: { type: 'integer' }, example: 1 }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Vacuum living room' },
                  assignedTo: { type: 'integer', nullable: true, example: 2, description: 'User ID of the assignee (must be a household member)' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Chore created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Chore' } } },
          },
          400: { description: 'Missing name or invalid assignee', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Not authenticated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Not a member of the household', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Household not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      get: {
        tags: ['Chores'],
        summary: 'List chores',
        description: 'Returns all chores for the household.',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'householdId', in: 'path', required: true, schema: { type: 'integer' }, example: 1 }],
        responses: {
          200: {
            description: 'List of chores',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Chore' } } } },
          },
          400: { description: 'Invalid household ID', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Not authenticated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Not a member', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Household not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/households/{householdId}/chores/{id}': {
      get: {
        tags: ['Chores'],
        summary: 'Get a chore',
        description: 'Returns a single chore by ID.',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'householdId', in: 'path', required: true, schema: { type: 'integer' }, example: 1 },
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1 },
        ],
        responses: {
          200: {
            description: 'Chore details',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Chore' } } },
          },
          400: { description: 'Invalid IDs', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Not authenticated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Not a member', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Chore or household not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      put: {
        tags: ['Chores'],
        summary: 'Update a chore',
        description: 'Updates a chore\'s name, status, or assignee. Assigned user or household admin only.',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'householdId', in: 'path', required: true, schema: { type: 'integer' }, example: 1 },
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1 },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Vacuum living room' },
                  status: { type: 'boolean', example: true },
                  assignedTo: { type: 'integer', nullable: true, example: 2 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Chore updated',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Chore' } } },
          },
          400: { description: 'Invalid fields or assignee not a member', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Not authenticated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Neither assigned user nor admin', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Chore not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        tags: ['Chores'],
        summary: 'Delete a chore',
        description: 'Deletes a chore. Assigned user or household admin only.',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'householdId', in: 'path', required: true, schema: { type: 'integer' }, example: 1 },
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1 },
        ],
        responses: {
          200: {
            description: 'Chore deleted',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' } } },
              },
            },
          },
          400: { description: 'Invalid IDs', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Not authenticated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Neither assigned user nor admin', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Chore not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/households/{householdId}/expenses': {
      post: {
        tags: ['Expenses'],
        summary: 'Create an expense',
        description: 'Records a new expense. The creator is set from the JWT. Split amount is computed at query time.',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'householdId', in: 'path', required: true, schema: { type: 'integer' }, example: 1 }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'cost'],
                properties: {
                  name: { type: 'string', example: 'Groceries' },
                  cost: { type: 'number', example: 90, description: 'Must be a positive number' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Expense created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Expense' } } },
          },
          400: { description: 'Missing name or invalid cost', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Not authenticated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Not a member of the household', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Household not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      get: {
        tags: ['Expenses'],
        summary: 'List expenses',
        description: 'Returns all expenses for the household with computed split amounts.',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'householdId', in: 'path', required: true, schema: { type: 'integer' }, example: 1 }],
        responses: {
          200: {
            description: 'List of expenses',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Expense' } } } },
          },
          400: { description: 'Invalid household ID', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Not authenticated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Not a member', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Household not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/households/{householdId}/expenses/{id}': {
      get: {
        tags: ['Expenses'],
        summary: 'Get an expense',
        description: 'Returns a single expense with computed split amount.',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'householdId', in: 'path', required: true, schema: { type: 'integer' }, example: 1 },
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1 },
        ],
        responses: {
          200: {
            description: 'Expense details',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Expense' } } },
          },
          400: { description: 'Invalid IDs', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Not authenticated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Not a member', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Expense not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      put: {
        tags: ['Expenses'],
        summary: 'Update an expense',
        description: 'Updates an expense name or cost. Expense creator or household admin only.',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'householdId', in: 'path', required: true, schema: { type: 'integer' }, example: 1 },
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1 },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Groceries + supplies' },
                  cost: { type: 'number', example: 110 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Expense updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    name: { type: 'string' },
                    cost: { type: 'number' },
                  },
                },
              },
            },
          },
          400: { description: 'Invalid fields or non-positive cost', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Not authenticated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Neither creator nor admin', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Expense not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        tags: ['Expenses'],
        summary: 'Delete an expense',
        description: 'Deletes an expense record. Expense creator or household admin only.',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'householdId', in: 'path', required: true, schema: { type: 'integer' }, example: 1 },
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1 },
        ],
        responses: {
          200: {
            description: 'Expense deleted',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' } } },
              },
            },
          },
          400: { description: 'Invalid IDs', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Not authenticated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Neither creator nor admin', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Expense not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
  },
};
