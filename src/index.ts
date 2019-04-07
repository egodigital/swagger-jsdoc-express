/**
 * This file is part of the swagger-jsdoc-express distribution.
 * Copyright (c) e.GO Digital GmbH, Aachen, Germany (https://www.e-go-digital.com/)
 *
 * swagger-jsdoc-express is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation, version 3.
 *
 * swagger-jsdoc-express is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import * as _ from 'lodash';
import * as deepMerge from 'deepmerge';
import * as express from 'express';
import * as fsExtra from 'fs-extra';
import * as glob from 'glob';
import * as path from 'path';
import * as swaggerUi from 'swagger-ui-express';
import { GenerateSwaggerV2DocumentOptions, generateSwaggerV2Document } from './generate';
import { parseSwaggerV2DocBlocks, SwaggerV2DocBlock } from './parse';
import { asArray, toStringSafe } from './utils';


/**
 * Options for 'createSwaggerV2UIFromSourceFiles()'.
 */
export interface CreateSwaggerV2UIFromSourceFiles {
    /**
     * The custom root / working directory.
     */
    'cwd'?: string;
    /**
     * Custom file search options.
     */
    'fileOptions'?: glob.IOptions;
    /**
     * One or more file pattern.
     */
    'files': string | string[];
    /**
     * Options for a swagger document.
     */
    'options'?: GenerateSwaggerV2DocumentOptions;
    /**
     * The custom root. Default: '/swagger'
     */
    'root'?: string;
}


/**
 * Creates (and optionally registers) an Express router for output a Swagge V2 API documentation.
 *
 * @param {CreateSwaggerV2UIFromSourceFiles} opts The options.
 * @param {express.Express|express.Router} [app] The optional app or router, where to register.
 */
export function createSwaggerV2UIFromSourceFiles(
    opts: CreateSwaggerV2UIFromSourceFiles,
    app?: express.Express | express.Router,
): express.Router {
    let cwd = toStringSafe(opts.cwd);
    if (path.isAbsolute(cwd)) {
        cwd = path.resolve(
            process.cwd(), cwd
        );
    }
    cwd = path.resolve(cwd);

    let filePatterns = asArray(opts.files)
        .map(fp => toStringSafe(fp))
        .filter(fp => '' !== fp.trim());
    if (!filePatterns.length) {
        filePatterns = [ '**' ];
    }

    const FILE_OPTIONS = deepMerge(
        {
            absolute: true,
            cwd: cwd,
            debug: false,
            dot: false,
            follow: true,
            mark: false,
            nocase: true,
            nodir: true,
            nonull: false,
            nosort: false,
            nounique: false,
            root: cwd,
            silent: true,
            stat: false,
            sync: true,
        },
        opts.fileOptions || {},
    );

    const SOURCE_FILES: string[] = [];

    for (const FP of filePatterns) {
        const FILE_LIST = glob.sync(FP, FILE_OPTIONS);
        for (const F of FILE_LIST) {
            SOURCE_FILES.push(
                F
            );
        }
    }

    const SOURCE_BLOCKS: SwaggerV2DocBlock[] = [];

    SOURCE_FILES.forEach(sf => {
        const SOURCE = fsExtra.readFileSync(
            sf, 'utf8'
        );

        SOURCE_BLOCKS.push
                     .apply(SOURCE_BLOCKS, parseSwaggerV2DocBlocks(SOURCE));
    });

    const SWAGGER_DOC = generateSwaggerV2Document(
        SOURCE_BLOCKS,
        opts.options,
    );

    let root = toStringSafe(opts.root);
    if ('' === root.trim()) {
        root = '/swagger';
    }
    if (!root.startsWith('/')) {
        root = '/' + root;
    }

    const ROUTER = express.Router();

    ROUTER.use('/', swaggerUi.serveFiles(SWAGGER_DOC));
    ROUTER.get('/', swaggerUi.setup(
        SWAGGER_DOC
    ));

    if (app) {
        app.use(root, ROUTER);
    }

    return ROUTER;
}
