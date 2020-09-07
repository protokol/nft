import { Exception } from "./base";

/**
 * @export
 * @class RuntimeException
 * @extends {Exception}
 */
export class RuntimeException extends Exception {}

/**
 * @export
 * @class AssertionException
 * @extends {Exception}
 */
export class AssertionException extends RuntimeException {}
