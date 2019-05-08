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
import * as doctrine from 'doctrine';
import * as yaml from 'js-yaml';


const JSDOC_REGEX = /\/\*\*([\s\S]*?)\*\//gm;


/**
 * Keeps sure to return a value as array.
 *
 * @param {T|T[]} val The input value.
 *
 * @return {T[]} The output value.
 */
export function asArray<T>(val: T | T[]): T[] {
    if (!Array.isArray(val)) {
        val = [val];
    }

    return val.filter(i => !_.isNil(i));
}

/**
 * Compares two values for sorting, by using a selector.
 *
 * @param {T} x The first value.
 * @param {T} y The second value.
 * @param {Function} selector The function, that selects the value to compare.
 *
 * @return {number} The soirt value.
 */
export function compareValuesBy<T, V>(x: T, y: T, selector: (i: T) => V): number {
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
 * Converts a value to a normalized string and checks if it is empty ('').
 *
 * @param {any} val The value to check.
 *
 * @return {boolean} Is empty string ('') or not.
 */
export function isEmptyString(val: any): boolean {
    return '' === normalizeString(val);
}

/**
 * Converts a value to a lower case and trimmed string.
 *
 * @param {any} val The input value.
 *
 * @return {string} The output value.
 */
export function normalizeString(val: any): string {
    return toStringSafe(val)
        .toLowerCase()
        .trim();
}

/**
 * Extracts JSDoc annotations from code.
 *
 * @param {string} code The code.
 *
 * @return {doctrine.Annotation[]} The extracted annotations.
 */
export function parseJSDoc(code: any): doctrine.Annotation[] {
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
 * Creates a cloned version of an object with sorted keys.
 *
 * @param {T} obj The input object.
 *
 * @return {T} The output object with sorted keys.
 */
export function sortObjectByKey<T>(obj: any): T {
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

/**
 * Converts a value to a string, if needed, that is not (null) and (undefined).
 *
 * @param {any} val The input value.
 *
 * @return {string} The output value.
 */
export function toStringSafe(val: any): string {
    if (_.isString(val)) {
        return val;
    }

    if (_.isNil(val)) {
        return '';
    }

    if (_.isFunction(val['toString'])) {
        return String(
            val.toString()
        );
    }

    return String(val);
}

/**
 * Tries to parse an object as YAML or JSON.
 *
 * @param {string} serializedData The serialized (string) data.
 *
 * @return {T|false} The parsed object or (false) if parsing failed.
 */
export function yamlOrJson<T = any>(
    serializedData: string
): T | false {
    serializedData = toStringSafe(serializedData);
    if ('' === serializedData.trim()) {
        return undefined;
    }

    try {
        try {
            return yaml.safeLoad(serializedData);
        } catch {
            return JSON.parse(serializedData);
        }
    } catch {
        return false;
    }
}
