/**
 * @export
 * @class Exception
 * @extends {Error}
 */
export class Exception extends Error {
	/**
	 * Creates an instance of Exception.
	 *
	 * @param {string} message
	 * @memberof Exception
	 */
	public constructor(message: string) {
		super(message);

		Object.defineProperty(this, "message", {
			enumerable: false,
			value: message,
		});

		Object.defineProperty(this, "name", {
			enumerable: false,
			value: this.constructor.name,
		});

		Error.captureStackTrace(this, this.constructor);
	}
}
