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
import * as doctrine from 'doctrine';
import * as express from 'express';
import * as fsExtra from 'fs-extra';
import * as glob from 'glob';
import * as path from 'path';
import * as swaggerUi from 'swagger-ui-express';
import * as yaml from 'js-yaml';

/**
 * Possible value for an API url scheme.
 */
export type ApiUrlScheme = 'http' | 'https';

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
    'options'?: GenerateSwaggerV2DocOptions;
    /**
     * The custom root. Default: '/swagger'
     */
    'root'?: string;
}

/**
 * Options for 'generateSwaggerV2Doc()' function.
 */
export interface GenerateSwaggerV2DocOptions {
    /**
     * External docs.
     */
    'externalDocs'?: SwaggerDocV2ExternalDocs;
    /**
     * The host name.
     */
    'host'?: string;
    /**
     * Information about the document.
     */
    'info'?: SwaggerDocV2Info;
    /**
     * The list of possible schemes.
     */
    'schemes'?: ApiUrlScheme | ApiUrlScheme[];
    /**
     * List of tags.
     */
    'tags'?: { [name: string]: string };
}

/**
 * A Swagger V2 documentation block for a definition.
 */
export interface SwaggerV2DefinitionBlock extends SwaggerV2DocBlock {
    /** @inheritdoc */
    'type': 'definition';
}

/**
 * A Swagger 2 document.
 */
export interface SwaggerDocV2 {
    /**
     * The header.
     */
    'swagger': '2.0';
    /**
     * Information about the document.
     */
    'info'?: SwaggerDocV2Info;
    /**
     * The host name.
     */
    'host'?: string;
    /**
     * List of tags.
     */
    'tags'?: SwaggerDocV2Tag[];
    /**
     * The list of possible schemes.
     */
    'schemes'?: ApiUrlScheme[];
    /**
     * The list of paths.
     */
    'paths'?: SwaggerDocV2Paths;
    /**
     * The list of definitions.
     */
    'definitions'?: SwaggerDocV2Definitions;
    /**
     * External docs.
     */
    'externalDocs'?: SwaggerDocV2ExternalDocs;
}

/**
 * List of Swagger 2 definitions.
 */
export type SwaggerDocV2Definitions = {
    [key: string]: any
};

/**
 * Swagger V2 external documentation information.
 */
export interface SwaggerDocV2ExternalDocs {
    /**
     * A description.
     */
    'description'?: string;
    /**
     * The URL to the documentation.
     */
    'url'?: string;
}

/**
 * Information of a Swagger 2 document.
 */
export interface SwaggerDocV2Info {
    /**
     * API description.
     */
    'description'?: string;
    /**
     * Version.
     */
    'version'?: string;
    /**
     * The title.
     */
    'title'?: string;
    /**
     * Contact information.
     */
    'contact'?: {
        /**
         * The email address.
         */
        'email'?: string;
    };
}

/**
 * List of Swagger 2 paths.
 */
export type SwaggerDocV2Paths = {
    [key: string]: any
};

/**
 * A Swagger 2 tag.
 */
export type SwaggerDocV2Tag = {
    /**
     * The description.
     */
    'description'?: string;
    /**
     * The name.
     */
    'name'?: string;
};

/**
 * A general Swagger V2 documentation block.
 */
export interface SwaggerV2DocBlock<TDetails extends object = object> {
    /**
     * The summary.
     */
    'description'?: string;
    /**
     * The details.
     */
    'details': TDetails | false | null | undefined;
    /**
     * The underlying JSDoc annotation.
     */
    'jsDoc': doctrine.Annotation;
    /**
     * The type.
     */
    'type': string;
}

/**
 * A Swagger V2 documentation block for a path.
 */
export interface SwaggerV2PathBlock extends SwaggerV2DocBlock {
    /** @inheritdoc */
    'type': 'path';
}


const JSDOC_REGEX = /\/\*\*([\s\S]*?)\*\//gm;


function asArray<T>(val: T | T[]): T[] {
    if (!Array.isArray(val)) {
        val = [ val ];
    }

    return val.filter(i => !_.isNil(i));
}

function compareValuesBy<T, V>(x: T, y: T, selector: (i: T) => V): number {
    const VAL_X = selector(x);
    const VAL_Y = selector(y);

    if (VAL_X !== VAL_Y) {
        if (VAL_X < VAL_Y) {
            return -1;
        }

        if (VAL_X > VAL_Y) {
            return 1;
        }
    }

    return 0;
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
                     .apply(SOURCE_BLOCKS, parseSwaggerV2Docs(SOURCE));
    });

    const SWAGGER_DOC = generateSwaggerV2Doc(
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

/**
 * Generates a Swagger V2 document.
 *
 * @param {SwaggerV2DocBlock|SwaggerV2DocBlock[]} blocks One or more blocks.
 * @param {GenerateSwaggerV2DocOptions} [opts] Custom, optional options.
 *
 * @return {SwaggerDocV2} The generated document.
 */
export function generateSwaggerV2Doc(
    blocks: SwaggerV2DocBlock | SwaggerV2DocBlock[],
    opts?: GenerateSwaggerV2DocOptions,
): SwaggerDocV2 {
    if (_.isNil(opts)) {
        opts = <any>{};
    }

    blocks = asArray(blocks);

    const PATH_BLOCKS = blocks.filter(b => {
        return 'path' === normalizeString(b.type);
    }) as SwaggerV2PathBlock[];

    const DEFINITION_BLOCKS = blocks.filter(b => {
        return 'definition' === normalizeString(b.type);
    }) as SwaggerV2DefinitionBlock[];

    const SCHEMES = asArray(opts.schemes)
        .map(s => normalizeString(s))
        .filter(s => '' !== s) as ApiUrlScheme[];

    const DOC: SwaggerDocV2 = {
        'swagger': '2.0',
        'info': _.isNil(opts.info) ? undefined : opts.info,
        'host': isEmptyString(opts.host) ? undefined : toStringSafe(opts.host).trim(),
        'tags': _.isNil(opts.tags) ? undefined : [],
        'schemes': SCHEMES.length ? SCHEMES : undefined,
        'paths': PATH_BLOCKS.length ? {} : undefined,
        'definitions': DEFINITION_BLOCKS.length ? {} : undefined,
        'externalDocs': _.isNil(opts.externalDocs) ? undefined : opts.externalDocs,
    };

    if (!_.isNil(opts.tags)) {
        for (const TAG_NAME in opts.tags) {
            DOC.tags.push({
                'name': TAG_NAME,
                'description': toStringSafe(opts.tags[TAG_NAME]),
            });
        }
    }

    if (PATH_BLOCKS.length) {
        for (const PB of PATH_BLOCKS) {
            if (!PB.details) {
                continue;
            }

            for (const PATH_NAME in PB.details) {
                DOC.paths[
                    PATH_NAME.trim()
                ] = PB.details[ PATH_NAME ];
            }
        }

        DOC.paths = sortObjectByKey(DOC.paths);
    }

    if (DEFINITION_BLOCKS.length) {
        for (const DB of DEFINITION_BLOCKS) {
            if (!DB.details) {
                continue;
            }

            for (const DEF_NAME in DB.details) {
                DOC.definitions[
                    DEF_NAME.trim()
                ] = DB.details[ DEF_NAME ];
            }
        }

        DOC.definitions = sortObjectByKey(DOC.definitions);
    }

    return DOC;
}

function isEmptyString(val: any): boolean {
    return '' === normalizeString(val);
}

function normalizeString(val: any): string {
    return toStringSafe(val)
        .toLowerCase()
        .trim();
}

function parseJSDoc(code: string): doctrine.Annotation[] {
    code = toStringSafe(code);

    const COMMENTS: doctrine.Annotation[] = [];

    const RESULTS = code.match(JSDOC_REGEX);
    if (RESULTS) {
        for (const R of RESULTS) {
            COMMENTS.push(
                doctrine.parse(R, {
                    unwrap: true
                })
            );
        }
    }

    return COMMENTS;
}

/**
 * Extracts / parses Swagger V2 documentation inside JSDoc blocks.
 *
 * @param {string} code The source code with the JSDoc blocks.
 *
 * @return {SwaggerV2DocBlock[]} The list of documentation.
 */
export function parseSwaggerV2Docs(code: string): SwaggerV2DocBlock[] {
    const DOCS: SwaggerV2DocBlock[] = [];

    const ANNOTATIONS = asArray(
        parseJSDoc(code)
    );
    for (const A of ANNOTATIONS) {
        try {
            const NEW_DOC: SwaggerV2DocBlock = {
                description: toStringSafe(A.description)
                    .trim(),
                details: undefined,
                jsDoc: A,
                type: undefined,
            };

            const TAGS = asArray(A.tags);
            let typeTag: doctrine.Tag;
            for (const T of TAGS) {
                const TAG_NAME = normalizeString(T.title);
                if (!TAG_NAME.startsWith('swagger')) {
                    continue;
                }

                NEW_DOC.type = TAG_NAME.substr(7)
                    .trim();
                if ('' === NEW_DOC.type) {
                    NEW_DOC.type = undefined;
                }

                typeTag = T;
            }

            if ('' === NEW_DOC.description) {
                NEW_DOC.description = undefined;
            }

            switch (NEW_DOC.type) {
                case 'definition':
                    {
                        const NEW_DEFINITION_DOC = NEW_DOC as SwaggerV2DefinitionBlock;

                        let details: any;
                        try {
                            if (!isEmptyString(typeTag.description)) {
                                details = yaml.safeLoad(
                                    typeTag.description
                                );
                            } else {
                                details = typeTag.description;
                            }
                        } catch {
                            details = false;
                        }

                        NEW_DEFINITION_DOC.details = details;
                    }
                    break;

                case 'path':
                    {
                        const NEW_PATH_DOC = NEW_DOC as SwaggerV2PathBlock;

                        let details: any;
                        try {
                            if (!isEmptyString(typeTag.description)) {
                                details = yaml.safeLoad(
                                    typeTag.description
                                );
                            } else {
                                details = typeTag.description;
                            }
                        } catch {
                            details = false;
                        }

                        NEW_PATH_DOC.details = details;
                    }
                    break;
            }

            DOCS.push(
                NEW_DOC
            );
        } catch { }
    }

    return DOCS;
}

function sortObjectByKey(obj: any): any {
    if (_.isNil(obj)) {
        return obj;
    }

    const SORTED_OBJ: any = {};

    for (const KEY of Object.keys(obj).sort(
        (x, y) => compareValuesBy(x, y, i => normalizeString(i))
    )) {
        let value = obj[KEY];

        if (_.isFunction(value)) {
            value = value.bind(SORTED_OBJ);
        }

        SORTED_OBJ[KEY] = value;
    }

    return SORTED_OBJ;
}

function toStringSafe(val: any): string {
    if (_.isString(val)) {
        return val;
    }

    if (_.isNil(val)) {
        return '';
    }

    return String(val);
}
