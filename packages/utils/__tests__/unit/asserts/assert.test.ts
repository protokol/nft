import "jest-extended";

import { assert } from "../../../src/asserts";

describe("Assertions", () => {
    it(".array", () => {
        expect(() => assert.array("abc")).toThrow('Expected value which is "array".');
        expect(() => assert.array([])).not.toThrow();
    });

    it(".bigint", () => {
        expect(() => assert.bigint("abc")).toThrow('Expected value which is "bigint".');
        expect(() => assert.bigint(1)).toThrow('Expected value which is "bigint".');
        expect(() => assert.bigint(BigInt(1))).not.toThrow();
    });

    it(".boolean", () => {
        expect(() => assert.boolean("abc")).toThrow('Expected value which is "boolean".');
        expect(() => assert.boolean(true)).not.toThrow();
        expect(() => assert.boolean(false)).not.toThrow();
    });

    it(".buffer", () => {
        expect(() => assert.buffer("abc")).toThrow('Expected value which is "buffer".');
        expect(() => assert.buffer(Buffer.alloc(8))).not.toThrow();
    });

    it(".defined", () => {
        expect(() => assert.defined(undefined)).toThrow('Expected value which is "non-null and non-undefined".');
        expect(() => assert.defined(null)).toThrow('Expected value which is "non-null and non-undefined".');
        expect(() => assert.defined("abc")).not.toThrow();
    });

    it(".number", () => {
        expect(() => assert.number("abc")).toThrow('Expected value which is "number".');
        expect(() => assert.number(1)).not.toThrow();
    });

    it(".object", () => {
        expect(() => assert.object("abc")).toThrow('Expected value which is "object".');
        expect(() => assert.object({})).not.toThrow();
    });

    it(".string", () => {
        expect(() => assert.string(1)).toThrow('Expected value which is "string".');
        expect(() => assert.string("abc")).not.toThrow();
    });

    it(".symbol", () => {
        expect(() => assert.symbol("abc")).toThrow('Expected value which is "symbol".');
        expect(() => assert.symbol(Symbol(1))).not.toThrow();
    });

    it(".undefined", () => {
        expect(() => assert.undefined("abc")).toThrow('Expected value which is "undefined".');
        expect(() => assert.undefined(undefined)).not.toThrow();
    });
});
