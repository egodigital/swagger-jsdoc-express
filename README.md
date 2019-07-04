[![npm](https://img.shields.io/npm/v/swagger-jsdoc-express.svg)](https://www.npmjs.com/package/swagger-jsdoc-express)

# swagger-jsdoc-express

Sets up one or more [Swagger](https://swagger.io/) documentation UIs via [Express](https://expressjs.com/) using [JSDoc](https://en.wikipedia.org/wiki/JSDoc) from source files.

## Install

Execute the following command from your project folder, where your `package.json` file is stored:

```bash
npm install --save swagger-jsdoc-express
```

## Example

### Setup UI

```typescript
import * as express from 'express';
import * as swaggerJSDocExpress from 'swagger-jsdoc-express';

const app = express();

// create a '/swagger' endpoint ...
swaggerJSDocExpress.setupSwaggerUIFromSourceFiles(
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
    // http://localhost:8080/swagger
    // now
});
```

### Document API

The following code shows, how to document API (you can put the JSDoc to all locations inside the files, which are handled by `setupSwaggerUIFromSourceFiles()` function):

```typescript
/**
 * @swaggerDefinition
 *
 * MonitoringStatusResult:
 *   type: object
 *   properties:
 *     data:
 *       type: object
 *       description: The monitoring data (if operation was successful).
 *       properties:
 *         cpu_load:
 *           type: number
 *           description: The CPU load in percentage.
 *           example: 0.05
 *         database_connected:
 *           type: boolean
 *           description: Indicates if app could connect to database or not.
 *           example: true
 *         disk_space:
 *           type: number
 *           description: 'The total disc space, in bytes.'
 *           example: 509197923979
 *         disk_space_used:
 *           type: number
 *           description: 'The disc space in use, in bytes.'
 *           example: 23979
 *         ram:
 *           type: number
 *           description: 'The total ram, in bytes.'
 *           example: 5091979000
 *         ram_used:
 *           type: number
 *           description: 'The ram in use, in bytes.'
 *           example: 23979
 *         version:
 *           type: object
 *           description: The app version.
 *           properties:
 *             date:
 *               type: string
 *               description: The last commit date.
 *               example: '1979-09-05T23:09:19.790Z'
 *             hash:
 *               type: string
 *               description: The last commit hash.
 *               example: 0123456789012345678901234567890123456789
 *     success:
 *       type: boolean
 *       description: Indicates if operation was successful or not.
 *       example: true
 */
interface MonitoringStatusResult {
    // ...
}


/**
 * @swaggerPath
 *
 * /monitoring/status:
 *   get:
 *     summary: Returns monitoring data.
 *     produces:
 *       - application/json
 *     responses:
 *       '200':
 *         description: Operation was successful.
 *         schema:
 *           $ref: '#/definitions/MonitoringStatusResult'
 *       '500':
 *         description: Server error
 */
app.get('/monitoring/status', (request, response) => {
    return response.status(200)
        .send(JSON.stringify(<MonitoringStatusResult>{
            // ...
        }));
});
```

Instead of using [YAML](https://en.wikipedia.org/wiki/YAML), you are also able to use [JSON](https://en.wikipedia.org/wiki/JSON) format.

## Contributors

* [m1h43l](https://github.com/m1h43l)

## Documentation

The complete API documentation can be found [here](https://egodigital.github.io/swagger-jsdoc-express/).

## Resources

* [Swagger 2.0 defintion](https://swagger.io/docs/specification/2-0/basic-structure/)
