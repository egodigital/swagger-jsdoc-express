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
import * as fastGlob from 'fast-glob';
import * as fsExtra from 'fs-extra';
import * as path from 'path';
import * as swaggerUi from 'swagger-ui-express';
import * as yaml from 'js-yaml';
import { GenerateSwaggerV2DocumentOptions, generateSwaggerV2Document } from './generate';
import { parseSwaggerV2DocBlocks, SwaggerV2DocBlock } from './parse';
import { asArray, isEmptyString, toStringSafe } from './utils';
import { EntryItem } from 'fast-glob/out/types/entries';
import { IPartialOptions } from 'fast-glob/out/managers/options';


/**
 * Options for 'setupSwaggerUIFromSourceFiles()'.
 */
export interface SetupSwaggerUIFromSourceFilesOptions {
    /**
     * Custom CSS for the UI.
     */
    'css'?: string;
    /**
     * The custom root / working directory.
     */
    'cwd'?: string;
    /**
     * Show debug message(s), like errors or not.
     */
    'debug'?: boolean;
    /**
     * Options for a swagger document.
     */
    'document'?: GenerateSwaggerV2DocumentOptions;
    /**
     * Custom Favicon for the UI.
     */
    'favIcon'?: string;
    /**
     * One or more file pattern. Default: all JS and TS files inside working directory
     */
    'files'?: string | string[];
    /**
     * The custom root endpoint (name). Default: '/swagger'
     */
    'root'?: string;
    /**
     * Custom file search options.
     */
    'searchOptions'?: IPartialOptions<EntryItem>;
    /**
     * Custom site title.
     */
    'title'?: string;
    /**
     * Custom (Swagger) URL.
     */
    'url'?: string;
}


/**
 * Creates (and optionally registers) an Express router for output a Swagge V2 API documentation.
 *
 * @param {SetupSwaggerUIFromSourceFilesOptions} opts The options.
 * @param {express.Express|express.Router} [app] The optional app or router, where to register.
 */
export function setupSwaggerUIFromSourceFiles(
    opts: SetupSwaggerUIFromSourceFilesOptions,
    app?: express.Express | express.Router,
): express.Router {
    let cwd = toStringSafe(opts.cwd);
    if (!path.isAbsolute(cwd)) {
        cwd = path.resolve(
            process.cwd(), cwd
        );
    }
    cwd = path.resolve(cwd);

    let filePatterns = asArray(opts.files)
        .map(fp => toStringSafe(fp))
        .filter(fp => '' !== fp.trim());
    if (!filePatterns.length) {
        filePatterns.push(
            '**/*.js', '**/*.ts'
        );
    }

    const FILE_OPTIONS = deepMerge(
        {
            absolute: true,
            case: false,
            cwd: cwd,
            deep: true,
            dot: false,
            followSymlinkedDirectories: true,
            markDirectories: false,
            nocase: true,
            onlyDirectories: false,
            onlyFiles: true,
            stats: false,
            unique: true,
        },
        opts.searchOptions || {},
    );

    const SOURCE_FILES: string[] = [];

    const FILE_LIST = fastGlob.sync(filePatterns, FILE_OPTIONS)
        .map(e => toStringSafe(e));
    for (const F of FILE_LIST) {
        SOURCE_FILES.push(
            F
        );
    }

    const SOURCE_BLOCKS: SwaggerV2DocBlock[] = [];

    SOURCE_FILES.forEach(sf => {
        const SOURCE = fsExtra.readFileSync(
            sf, 'utf8'
        );

        SOURCE_BLOCKS.push
            .apply(SOURCE_BLOCKS, parseSwaggerV2DocBlocks(SOURCE, {
                debug: opts.debug,
            }));
    });

    const SWAGGER_DOC = generateSwaggerV2Document(
        SOURCE_BLOCKS,
        opts.document,
    );

    let root = toStringSafe(opts.root);
    if ('' === root.trim()) {
        root = '/swagger';
    }
    if (!root.trim().startsWith('/')) {
        root = '/' + root;
    }

    let css = toStringSafe(opts.css);
    if (isEmptyString(css)) {
        css = null;
    }

    let favIcon = toStringSafe(opts.favIcon);
    if (isEmptyString(favIcon)) {
        favIcon = null;
    }

    let url = toStringSafe(opts.url);
    if (isEmptyString(url)) {
        url = null;
    }

    let title = toStringSafe(opts.title);
    if (isEmptyString(title)) {
        title = null;
    }

    const ROUTER = express.Router();

    ROUTER.use('/', swaggerUi.serveFiles(SWAGGER_DOC));
    ROUTER.get('/', swaggerUi.setup(
        SWAGGER_DOC,
        null,  // opts
        null,  // options
        css,  // customCss
        favIcon,  // customfavIcon
        url,  // swaggerUrl
        title,  // customeSiteTitle
    ));

    // download link (JSON)
    ROUTER.get(`/json`, function (req, res) {
        return res.status(200)
            .header('content-type', 'application/json; charset=utf-8')
            .header('content-disposition', `attachment; filename=api.json`)
            .send(
                Buffer.from(JSON.stringify(SWAGGER_DOC, null, 2),
                    'utf8')
            );
    });

    // download link (YAML)
    ROUTER.get(`/yaml`, function (req, res) {
        return res.status(200)
            .header('content-type', 'application/x-yaml; charset=utf-8')
            .header('content-disposition', `attachment; filename=api.yaml`)
            .send(
                Buffer.from(yaml.safeDump(SWAGGER_DOC),
                    'utf8')
            );
    });

    if (app) {
        app.use(root, ROUTER);
    }

    return ROUTER;
}
