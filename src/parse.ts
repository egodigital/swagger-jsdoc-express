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

import * as doctrine from 'doctrine';
import { asArray, normalizeString, toStringSafe, yamlOrJson } from './utils';


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
 * A Swagger V2 documentation block for a definition.
 */
export interface SwaggerV2DefinitionDocBlock extends SwaggerV2DocBlock {
    /** @inheritdoc */
    'type': 'definition';
}

/**
 * A Swagger V2 documentation block for a path.
 */
export interface SwaggerV2PathDocBlock extends SwaggerV2DocBlock {
    /** @inheritdoc */
    'type': 'path';
}


const JSDOC_REGEX = /\/\*\*([\s\S]*?)\*\//gm;


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
export function parseSwaggerV2DocBlocks(code: string): SwaggerV2DocBlock[] {
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
            let typeTag: doctrine.Tag | false = false;
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

            if (!typeTag) {
                continue;
            }

            if ('' === NEW_DOC.description) {
                NEW_DOC.description = undefined;
            }

            switch (NEW_DOC.type) {
                case 'definition':
                    {
                        const NEW_DEFINITION_DOC = NEW_DOC as SwaggerV2DefinitionDocBlock;

                        NEW_DEFINITION_DOC.details = yamlOrJson<object>(typeTag.description);
                    }
                    break;

                case 'path':
                    {
                        const NEW_PATH_DOC = NEW_DOC as SwaggerV2PathDocBlock;

                        NEW_PATH_DOC.details = yamlOrJson<object>(typeTag.description);
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
