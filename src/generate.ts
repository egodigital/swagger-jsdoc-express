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
import { SwaggerV2DocBlock, SwaggerV2DefinitionDocBlock, SwaggerV2PathDocBlock } from './parse';
import { asArray, compareValuesBy, isEmptyString, normalizeString, sortObjectByKey, toStringSafe } from './utils';


/**
 * Possible value for an API url scheme.
 */
export type ApiUrlScheme = 'http' | 'https';

/**
 * Options for 'generateSwaggerV2Doc()' function.
 */
export interface GenerateSwaggerV2DocumentOptions {
    /**
     * The base path of the API.
     */
    'basePath'?: string;
    /**
     * External docs.
     */
    'externalDocs'?: SwaggerV2DocumentExternalDocs;
    /**
     * The host name.
     */
    'host'?: string;
    /**
     * Information about the document.
     */
    'info'?: SwaggerV2DocumentInfo;
    /**
     * The list of possible schemes.
     */
    'schemes'?: ApiUrlScheme | ApiUrlScheme[];
    /**
     * List of tags (key => name; value => description).
     */
    'tags'?: { [name: string]: string };
}

/**
 * List of Swagger 2 definitions.
 */
export type SwaggerV2DocDefinitionList = {
    [key: string]: any
};

/**
 * Information of a Swagger 2 document.
 */
export interface SwaggerV2DocumentInfo {
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
 * Swagger V2 external documentation information.
 */
export interface SwaggerV2DocumentExternalDocs {
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
 * A Swagger 2 document.
 */
export interface SwaggerV2Document {
    /**
     * The header.
     */
    'swagger': '2.0';
    /**
     * Information about the document.
     */
    'info'?: SwaggerV2DocumentInfo;
    /**
     * The host name.
     */
    'host'?: string;
    /**
     * List of tags.
     */
    'tags'?: SwaggerV2DocumentTag[];
    /**
     * The list of possible schemes.
     */
    'schemes'?: ApiUrlScheme[];
    /**
     * The list of paths.
     */
    'paths'?: SwaggerV2DocumentPathList;
    /**
     * The list of definitions.
     */
    'definitions'?: SwaggerV2DocDefinitionList;
    /**
     * External docs.
     */
    'externalDocs'?: SwaggerV2DocumentExternalDocs;
    /**
     * The base path of the API.
     */
    'basePath'?: string;
}

/**
 * List of Swagger 2 paths.
 */
export type SwaggerV2DocumentPathList = {
    [key: string]: any
};

/**
 * A Swagger 2 tag.
 */
export type SwaggerV2DocumentTag = {
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
 * Generates a Swagger V2 document.
 *
 * @param {SwaggerV2DocBlock|SwaggerV2DocBlock[]} blocks One or more blocks.
 * @param {GenerateSwaggerV2DocumentOptions} [opts] Custom, optional options.
 *
 * @return {SwaggerV2Document} The generated document.
 */
export function generateSwaggerV2Document(
    blocks: SwaggerV2DocBlock | SwaggerV2DocBlock[],
    opts?: GenerateSwaggerV2DocumentOptions,
): SwaggerV2Document {
    if (_.isNil(opts)) {
        opts = <any>{};
    }

    blocks = asArray(blocks);

    const PATH_BLOCKS = blocks.filter(b => {
        return 'path' === normalizeString(b.type);
    }) as SwaggerV2PathDocBlock[];

    const DEFINITION_BLOCKS = blocks.filter(b => {
        return 'definition' === normalizeString(b.type);
    }) as SwaggerV2DefinitionDocBlock[];

    const SCHEMES = asArray(opts.schemes)
        .map(s => normalizeString(s))
        .filter(s => '' !== s) as ApiUrlScheme[];

    const DOC: SwaggerV2Document = {
        'swagger': '2.0',
        'info': _.isNil(opts.info) ? undefined : opts.info,
        'host': isEmptyString(opts.host) ? undefined : toStringSafe(opts.host).trim(),
        'tags': _.isNil(opts.tags) ? undefined : [],
        'schemes': SCHEMES.length ? SCHEMES : undefined,
        'paths': PATH_BLOCKS.length ? {} : undefined,
        'definitions': DEFINITION_BLOCKS.length ? {} : undefined,
        'externalDocs': _.isNil(opts.externalDocs) ? undefined : opts.externalDocs,
        'basePath': isEmptyString(opts.basePath) ? undefined : opts.basePath,
    };

    // tags
    if (!_.isNil(opts.tags)) {
        for (const TAG_NAME of Object.keys(
            opts.tags
        ).sort((x, y) => compareValuesBy(x, y, i => normalizeString(i)))) {
            DOC.tags.push({
                'name': TAG_NAME,
                'description': toStringSafe(opts.tags[TAG_NAME]),
            });
        }
    }

    // paths
    if (PATH_BLOCKS.length) {
        for (const PB of PATH_BLOCKS) {
            if (!PB.details) {
                continue;
            }

            for (const DETAILS_PROP in PB.details) {
                const PATH_PROP = DETAILS_PROP.trim();
                if (_.isNil(DOC.paths[PATH_PROP])) {
                    DOC.paths[PATH_PROP] = {};
                }

                DOC.paths[PATH_PROP] = sortObjectByKey(
                    deepMerge(DOC.paths[PATH_PROP], PB.details[DETAILS_PROP])
                );
            }
        }

        DOC.paths = sortObjectByKey(DOC.paths);
    }

    // definitions
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

    // we need a "clean" plain object here
    return JSON.parse(
        JSON.stringify(DOC)
    );
}
