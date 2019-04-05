[![npm](https://img.shields.io/npm/v/swagger-jsdoc-express.svg)](https://www.npmjs.com/package/swagger-jsdoc-express)

# swagger-jsdoc-express

Helpes for generating and displaying [Swagger](https://swagger.io/) documentation UIs via [Express](https://expressjs.com/).

## Install

Execute the following command from your project folder, where your `package.json` file is stored:

```bash
npm install --save swagger-jsdoc-express
```

## Example

```typescript
import * as express from 'express';
import * as swaggerJSDocExpress from 'swagger-jsdoc-express';

const app = express();

// create a '/swagger' endpoint ...
swaggerJSDocExpress.createSwaggerV2UIFromSourceFiles(
    {
        cwd: '/root/path/to/source/files',
        files: [ '**/*.ts', '**/*.js' ],
    },

    // ... and directly register it
    // in 'app'
    app
);

app.listen(8080, () => {
    // should be available via
    // https://localhost:8080/swagger
    // now
});
```
