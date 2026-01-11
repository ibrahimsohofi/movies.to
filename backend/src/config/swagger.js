import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Movies.to API',
      version: '1.0.0',
      description: 'A comprehensive movie discovery platform API built with Express.js and MySQL',
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
      contact: {
        name: 'Movies.to Support',
        email: 'support@movies.to',
        url: 'https://movies.to',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server',
      },
      {
        url: 'https://api.movies.to',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'User ID',
            },
            username: {
              type: 'string',
              description: 'Username',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation date',
            },
          },
        },
        Movie: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'TMDB Movie ID',
            },
            title: {
              type: 'string',
              description: 'Movie title',
            },
            overview: {
              type: 'string',
              description: 'Movie overview',
            },
            releaseDate: {
              type: 'string',
              format: 'date',
              description: 'Release date',
            },
            voteAverage: {
              type: 'number',
              format: 'float',
              description: 'Average vote rating',
            },
            posterPath: {
              type: 'string',
              description: 'Poster image path',
            },
          },
        },
        Review: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Review ID',
            },
            userId: {
              type: 'integer',
              description: 'User ID',
            },
            movieId: {
              type: 'integer',
              description: 'Movie ID',
            },
            rating: {
              type: 'number',
              minimum: 0,
              maximum: 10,
              description: 'Rating (0-10)',
            },
            comment: {
              type: 'string',
              description: 'Review comment',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Comment: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Comment ID',
            },
            userId: {
              type: 'integer',
              description: 'User ID',
            },
            movieId: {
              type: 'integer',
              description: 'Movie ID',
            },
            parentId: {
              type: 'integer',
              nullable: true,
              description: 'Parent comment ID (for replies)',
            },
            content: {
              type: 'string',
              description: 'Comment content',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        WatchlistItem: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Watchlist item ID',
            },
            movieId: {
              type: 'integer',
              description: 'Movie ID',
            },
            movieData: {
              $ref: '#/components/schemas/Movie',
            },
            addedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              description: 'Success message',
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'Unauthorized',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'Resource not found',
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'Validation failed',
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication endpoints',
      },
      {
        name: 'Users',
        description: 'User management endpoints',
      },
      {
        name: 'Watchlist',
        description: 'Watchlist management endpoints',
      },
      {
        name: 'Reviews',
        description: 'Movie reviews endpoints',
      },
      {
        name: 'Comments',
        description: 'Movie comments endpoints',
      },
      {
        name: 'Torrents',
        description: 'Torrent information endpoints',
      },
      {
        name: 'Sync',
        description: 'Data synchronization endpoints',
      },
    ],
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
  ],
};

const specs = swaggerJsdoc(options);

export default specs;
