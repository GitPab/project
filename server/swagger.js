import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SACMA Du Học API',
      version: '1.0.0',
      description: 'API documentation for SACMA - Hệ thống quản lý du học Hàn Quốc',
      contact: {
        name: 'SACMA Support',
        email: 'support@sacma.edu.vn'
      }
    },
    servers: [
      {
        url: '/api',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        University: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            koreanName: { type: 'string' },
            country: { type: 'string' },
            region: { type: 'string' },
            top_tier: { type: 'string', enum: ['Top1', 'Top2', 'Top3'] },
            ranking: { type: 'string' },
            heroImage: { type: 'string' },
            thumbnail: { type: 'string' },
            koreanData: { type: 'object' },
            is_active: { type: 'boolean' }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['student', 'admin', 'super_admin', 'admin_manager', 'content_editor', 'finance_admin', 'viewer'] },
            phone: { type: 'string' },
            is_active: { type: 'boolean' },
            last_login: { type: 'string', format: 'date-time' }
          }
        },
        Registration: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            student_id: { type: 'string', format: 'uuid' },
            university_id: { type: 'string', format: 'uuid' },
            status: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        AuditLog: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            action: { type: 'string', enum: ['CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'LOGIN', 'LOGOUT'] },
            entity_type: { type: 'string' },
            entity_id: { type: 'string' },
            old_values: { type: 'object' },
            new_values: { type: 'object' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    tags: [
      { name: 'Authentication', description: 'User login and registration' },
      { name: 'Universities', description: 'University CRUD operations' },
      { name: 'Registrations', description: 'Student registrations' },
      { name: 'Admin', description: 'Admin management and invites' },
      { name: 'System', description: 'Health checks and system info' }
    ]
  },
  apis: ['./server.js', './routes/*.js'] // Path to API routes
};

export function setupSwagger(app) {
  const specs = swaggerJsdoc(options);
  
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'SACMA API Documentation'
  }));
  
  // JSON endpoint for raw spec
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
}

export default options;
