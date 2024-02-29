import { expect, describe, test, beforeEach } from "vitest";

import { webcrypto } from "node:crypto";
import { connectedPeers } from "cojson/src/streamUtils.js";
import { newRandomSessionID } from "cojson/src/coValueCore.js";
import { Effect, Queue } from "effect";
import { Co, S, SimpleAccount, jazzReady } from "..";
import { rawCoValueSym } from "../coValueInterfaces";

if (!("crypto" in globalThis)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).crypto = webcrypto;
}

beforeEach(async () => {
    await jazzReady;
});

describe("Simple CoMap operations", async () => {
    const me = await SimpleAccount.create({
        name: "Hermes Puggington",
    });

    class TestMap extends Co.map({
        color: S.string,
        height: S.number,
        birthday: S.Date
    }) {}

    const birthday = new Date();

    const map = new TestMap(me, {
        color: "red",
        height: 10,
        birthday: birthday
    });

    test("Construction", () => {
        expect(map.color).toEqual("red");
        expect(map.height).toEqual(10);
        expect(map.birthday).toEqual(birthday);
        expect(map[rawCoValueSym].get("birthday")).toEqual(birthday.toISOString());
    });

    describe("Mutation", () => {
        test("assignment", () => {
            map.color = "blue";
            expect(map.color).toEqual("blue");
            expect(map[rawCoValueSym].get("color")).toEqual("blue");
            const newBirthday = new Date();
            map.birthday = newBirthday;
            expect(map.birthday).toEqual(newBirthday);
            expect(map[rawCoValueSym].get("birthday")).toEqual(newBirthday.toISOString());
        });
    });
});