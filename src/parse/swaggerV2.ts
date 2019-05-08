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

import { parseSwaggerDocBlocks, SwaggerDefinitionDocBlock, SwaggerDocBlock, SwaggerPathDocBlock } from './index';


/**
 * @deprecated
 *
 * @see SwaggerDefinitionDocBlock
 */
export type SwaggerV2DefinitionDocBlock = SwaggerDefinitionDocBlock;

/**
 * @deprecated
 *
 * @see SwaggerDocBlock<TDetails>
 */
export type SwaggerV2DocBlock<TDetails extends object = object> = SwaggerDocBlock<TDetails>;

/**
 * @deprecated
 *
 * @see SwaggerPathDocBlock
 */
export type SwaggerV2PathDocBlock = SwaggerPathDocBlock;


/**
 * @deprecated
 *
 * @see parseSwaggerDocBlocks
 */
export function parseSwaggerV2DocBlocks(code: string): SwaggerV2DocBlock[] {
    return parseSwaggerDocBlocks.apply(this, arguments);
}
