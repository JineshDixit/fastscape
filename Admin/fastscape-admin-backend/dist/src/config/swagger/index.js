"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.specs = exports.setupSwagger = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Fastscape Admin API',
            version: '1.0.0',
            description: 'API documentation for Fastscape Admin Backend - Admin user management, roles, policies, and system administration',
            contact: {
                name: 'Fastscape Development Team',
                email: 'dev@fastscape.com',
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT',
            },
        },
        servers: [
            {
                url: process.env.NODE_ENV === 'production'
                    ? 'https://admin-api.fastscape.com'
                    : `http://localhost:${process.env.PORT || 3001}`,
                description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your admin JWT token in the format: Bearer <token>',
                },
            },
            schemas: {
                // Admin User Schemas
                AdminUser: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'Unique admin user identifier',
                            example: 1,
                        },
                        firstName: {
                            type: 'string',
                            description: 'Admin first name',
                            example: 'John',
                        },
                        lastName: {
                            type: 'string',
                            description: 'Admin last name',
                            example: 'Doe',
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'Admin email address',
                            example: 'admin@fastscape.com',
                        },
                        isActive: {
                            type: 'boolean',
                            description: 'Whether the admin user is active',
                            example: true,
                        },
                        permissions: {
                            type: 'array',
                            items: {
                                type: 'string',
                            },
                            description: 'Flattened array of all permissions',
                            example: ['users.manage', 'roles.view', 'policies.manage'],
                        },
                        roles: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/Role',
                            },
                            description: 'Admin user roles with policies',
                        },
                    },
                },
                Role: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'Unique role identifier',
                            example: 1,
                        },
                        name: {
                            type: 'string',
                            description: 'Role name',
                            example: 'User Manager',
                        },
                        description: {
                            type: 'string',
                            description: 'Role description',
                            example: 'Can manage users and view roles',
                        },
                        isActive: {
                            type: 'boolean',
                            description: 'Whether the role is active',
                            example: true,
                        },
                        policies: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/Policy',
                            },
                            description: 'Policies assigned to this role',
                        },
                    },
                },
                Policy: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'Unique policy identifier',
                            example: 1,
                        },
                        name: {
                            type: 'string',
                            description: 'Policy name',
                            example: 'User Management',
                        },
                        permissions: {
                            type: 'array',
                            items: {
                                type: 'string',
                            },
                            description: 'Array of permissions',
                            example: ['users.manage', 'users.view'],
                        },
                        description: {
                            type: 'string',
                            description: 'Policy description',
                            example: 'Full user management access',
                        },
                        isActive: {
                            type: 'boolean',
                            description: 'Whether the policy is active',
                            example: true,
                        },
                    },
                },
                // Auth Schemas
                AdminLoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'Admin email address',
                            example: 'admin@fastscape.com',
                        },
                        password: {
                            type: 'string',
                            description: 'Admin password',
                            example: 'AdminPass123!',
                        },
                    },
                },
                CreateAdminUserRequest: {
                    type: 'object',
                    required: ['firstName', 'lastName', 'email', 'password'],
                    properties: {
                        firstName: {
                            type: 'string',
                            minLength: 2,
                            maxLength: 50,
                            description: 'Admin first name',
                            example: 'Jane',
                        },
                        lastName: {
                            type: 'string',
                            minLength: 2,
                            maxLength: 50,
                            description: 'Admin last name',
                            example: 'Smith',
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'Admin email address',
                            example: 'jane.smith@fastscape.com',
                        },
                        password: {
                            type: 'string',
                            minLength: 8,
                            description: 'Password (min 8 chars, must contain uppercase, lowercase, number, and special character)',
                            example: 'SecureAdminPass123!',
                        },
                        roleIds: {
                            type: 'array',
                            items: {
                                type: 'integer',
                            },
                            description: 'Array of role IDs to assign to the admin user',
                            example: [1, 2],
                        },
                    },
                },
                RefreshTokenRequest: {
                    type: 'object',
                    required: ['refreshToken'],
                    properties: {
                        refreshToken: {
                            type: 'string',
                            description: 'Valid admin refresh token',
                            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        },
                    },
                },
                PasswordChangeRequest: {
                    type: 'object',
                    required: ['currentPassword', 'newPassword', 'confirmPassword'],
                    properties: {
                        currentPassword: {
                            type: 'string',
                            description: 'Current password',
                            example: 'OldPassword123!',
                        },
                        newPassword: {
                            type: 'string',
                            minLength: 8,
                            description: 'New password (min 8 chars, must contain uppercase, lowercase, number, and special character)',
                            example: 'NewPassword123!',
                        },
                        confirmPassword: {
                            type: 'string',
                            description: 'Confirm new password (must match newPassword)',
                            example: 'NewPassword123!',
                        },
                    },
                },
                CheckPermissionsRequest: {
                    type: 'object',
                    required: ['permissions'],
                    properties: {
                        permissions: {
                            type: 'array',
                            items: {
                                type: 'string',
                            },
                            description: 'Array of permissions to check',
                            example: ['users.manage', 'roles.view'],
                        },
                    },
                },
                AuthTokens: {
                    type: 'object',
                    properties: {
                        accessToken: {
                            type: 'string',
                            description: 'JWT access token (expires in 15 minutes)',
                            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        },
                        refreshToken: {
                            type: 'string',
                            description: 'JWT refresh token (expires in 7 days)',
                            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        },
                        accessTokenExpiresAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Access token expiration timestamp',
                            example: '2024-01-01T12:15:00.000Z',
                        },
                        refreshTokenExpiresAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Refresh token expiration timestamp',
                            example: '2024-01-08T12:00:00.000Z',
                        },
                    },
                },
                // Response Schemas
                SuccessResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true,
                        },
                        message: {
                            type: 'string',
                            example: 'Operation completed successfully',
                        },
                        data: {
                            type: 'object',
                            description: 'Response data',
                        },
                        meta: {
                            type: 'object',
                            properties: {
                                timestamp: {
                                    type: 'string',
                                    format: 'date-time',
                                    example: '2024-01-01T12:00:00.000Z',
                                },
                            },
                        },
                    },
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false,
                        },
                        error: {
                            type: 'string',
                            example: 'Error message',
                        },
                        errors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    field: {
                                        type: 'string',
                                        example: 'email',
                                    },
                                    message: {
                                        type: 'string',
                                        example: 'Email is required',
                                    },
                                },
                            },
                        },
                        meta: {
                            type: 'object',
                            properties: {
                                timestamp: {
                                    type: 'string',
                                    format: 'date-time',
                                    example: '2024-01-01T12:00:00.000Z',
                                },
                            },
                        },
                    },
                },
                HealthResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true,
                        },
                        message: {
                            type: 'string',
                            example: 'Admin API is healthy',
                        },
                        timestamp: {
                            type: 'string',
                            format: 'date-time',
                            example: '2024-01-01T12:00:00.000Z',
                        },
                        environment: {
                            type: 'string',
                            example: 'development',
                        },
                    },
                },
            },
        },
        tags: [
            {
                name: 'Health',
                description: 'Health check endpoints',
            },
            {
                name: 'Authentication',
                description: 'Admin authentication and authorization',
            },
            {
                name: 'Admin Management',
                description: 'Admin user management (admin only)',
            },
            {
                name: 'Profile',
                description: 'Admin profile management',
            },
            {
                name: 'Permissions',
                description: 'Permission checking and validation',
            },
        ],
    },
    apis: [
        // './src/routes/*.ts',
        // './src/controllers/*.ts',
        './src/server.ts',
    ],
};
const specs = (0, swagger_jsdoc_1.default)(options);
exports.specs = specs;
const setupSwagger = (app) => {
    // Swagger UI options
    const swaggerUiOptions = {
        explorer: true,
        customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #c0392b; }
      .swagger-ui .scheme-container { background: #fff5f5; padding: 10px; border-radius: 5px; border: 1px solid #e74c3c; }
      .swagger-ui .info .description { color: #2c3e50; }
    `,
        customSiteTitle: 'Fastscape Admin API Documentation',
        customfavIcon: '/favicon.ico',
        swaggerOptions: {
            persistAuthorization: true,
            displayRequestDuration: true,
            docExpansion: 'none',
            filter: true,
            showExtensions: true,
            showCommonExtensions: true,
            tryItOutEnabled: true,
        },
    };
    // Serve Swagger UI
    app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(specs, swaggerUiOptions));
    // Serve Swagger JSON
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(specs);
    });
    console.log(`Admin Swagger documentation available at: http://localhost:${process.env.PORT || 3001}/api-docs`);
};
exports.setupSwagger = setupSwagger;
//# sourceMappingURL=index.js.map