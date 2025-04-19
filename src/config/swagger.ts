const swaggerJSDoc = require('swagger-jsdoc');
const path = require('path');
const { version } = require('../../package.json');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'VLM Nutrition Info API',
    version: version || '1.0.0',
    description: 'API for the Vision Language Model Nutrition Information Application',
    contact: {
      name: 'API Support',
      email: 'support@example.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT || 5000}`,
      description: 'Development server'
    }
  ],
  tags: [
    {
      name: 'Food Analysis',
      description: 'Endpoints for analyzing food images and nutrition information'
    },
    {
      name: 'User Management',
      description: 'User authentication and profile management'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

// Use absolute path resolution
const rootDir = path.resolve(__dirname, '../../');

const options = {
  swaggerDefinition,
  apis: [
    path.join(rootDir, 'src/routes/**/*.ts'),
    path.join(rootDir, 'src/controllers/**/*.ts'),
    path.join(rootDir, 'src/models/**/*.ts'),
    // Also include compiled JavaScript files in case you're running from built code
    path.join(rootDir, 'dist/routes/**/*.js'),
    path.join(rootDir, 'dist/controllers/**/*.js'),
    path.join(rootDir, 'dist/models/**/*.js')
  ]
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;