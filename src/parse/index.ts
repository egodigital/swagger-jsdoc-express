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
import { asArray, normalizeString, parseJSDoc, toStringSafe, yamlOrJson } from '../utils';


/**
 * A general Swagger documentation block.
 */
export interface SwaggerDocBlock<TDetails extends object = object> {
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
 * A Swagger documentation block for a definition.
 */
export interface SwaggerDefinitionDocBlock extends SwaggerDocBlock {
    /** @inheritdoc */
    'type': 'definition';
}

/**
 * A Swagger documentation block for a path.
 */
export interface SwaggerPathDocBlock extends SwaggerDocBlock {
    /** @inheritdoc */
    'type': 'path';
}


/**
 * Extracts / parses Swagger documentation inside JSDoc blocks.
 *
 * @param {any} code The source code with the JSDoc blocks.
 *
 * @return {SwaggerDocBlock[]} The list of documentation.
 */
export function parseSwaggerDocBlocks(code: any): SwaggerDocBlock[] {
    const DOCS: SwaggerDocBlock[] = [];

    const ANNOTATIONS = asArray(
        parseJSDoc(code)
    );
    for (const A of ANNOTATIONS) {
        try {
            const NEW_DOC: SwaggerDocBlock = {
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
                        const NEW_DEFINITION_DOC = NEW_DOC as SwaggerDefinitionDocBlock;

                        NEW_DEFINITION_DOC.details = yamlOrJson<object>(typeTag.description);
                    }
                    break;

                case 'path':
                    {
                        const NEW_PATH_DOC = NEW_DOC as SwaggerPathDocBlock;

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


export * from './swaggerV2';
