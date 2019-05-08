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

/**
 * Possible value for an API url scheme.
 */
export type ApiUrlScheme = 'http' | 'https';


/**
 * The output format of a Swagger document.
 */
export enum SwaggerDocumentOutputFormat {
    /**
     * Swagger 2.0
     */
    Swagger2 = 0,

    /**
     * Open API 3.0
     */
    OpenApi3 = 1,
}


export * from './swaggerV2';
