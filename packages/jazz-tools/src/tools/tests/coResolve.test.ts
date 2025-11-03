import { beforeAll, describe, expect, test } from "vitest";
import { Account, co, CoValueLoadingState, Group, z } from "../exports";
import { createJazzTestAccount, setupJazzTestSync } from "../testing";
import { assertLoaded, setupTwoNodes } from "./utils";

describe("Schema.resolved()", () => {
  beforeAll(async () => {
    await setupJazzTestSync();
    await createJazzTestAccount({
      isCurrentActiveAccount: true,
      creationProps: { name: "Hermes Puggington" },
    });
  });

  test("all CoValue schemas have a `true` resolve query by default", () => {
    const AllSchemas = [
      co.plainText(),
      co.richText(),
      co.fileStream(),
      co.vector(1),
      co.group(),
      co.list(co.plainText()),
      co.feed(co.plainText()),
      co.map({ text: co.plainText() }),
      co.record(z.string(), co.plainText()),
      co.optional(co.plainText()),
      co.discriminatedUnion("type", [
        co.map({ type: z.literal("a") }),
        co.map({ type: z.literal("b") }),
      ]),
    ];

    for (const Schema of AllSchemas) {
      expect(Schema.resolve).toBe(true);
    }
  });

  describe("allows adding a default resolve query", () => {
    test("to a CoMap schema", () => {
      const TestMap = co.map({
        name: co.plainText(),
      });

      const TestMapWithName = TestMap.resolved({
        name: true,
      });

      expect(TestMapWithName.resolve).toEqual({
        name: true,
      });
    });

    test("to a CoRecord schema", () => {
      const TestRecord = co.record(z.string(), co.plainText());

      const TestRecordWithName = TestRecord.resolved({
        name: true,
      });

      expect(TestRecordWithName.resolve).toEqual({
        name: true,
      });
    });

    test("to a CoList schema", () => {
      const TestList = co.list(co.plainText());

      const TestListWithItems = TestList.resolved({
        $each: true,
      });

      expect(TestListWithItems.resolve).toEqual({
        $each: true,
      });
    });

    test("to a CoFeed schema", () => {
      const TestFeed = co.feed(co.plainText());

      const TestFeedWithItems = TestFeed.resolved({
        $each: true,
      });

      expect(TestFeedWithItems.resolve).toEqual({
        $each: true,
      });
    });

    test("to an Account schema", () => {
      const TestAccount = co.account();

      const TestAccountWithName = TestAccount.resolved({
        profile: true,
      });

      expect(TestAccountWithName.resolve).toEqual({
        profile: true,
      });
    });
  });

  describe("the schema's resolve query is used when loading CoValues", () => {
    let clientAccount: Account;
    let serverAccount: Account;
    let publicGroup: Group;

    beforeAll(async () => {
      ({ clientAccount, serverAccount } = await setupTwoNodes());
      publicGroup = Group.create(serverAccount).makePublic("writer");
    });

    describe("on load()", () => {
      test("for CoMap", async () => {
        const TestMap = co.map({
          name: co.plainText(),
        });

        const TestMapWithName = TestMap.resolved({
          name: true,
        });

        const map = TestMapWithName.create(
          {
            name: "Test",
          },
          publicGroup,
        );

        const loadedMap = await TestMapWithName.load(map.$jazz.id, {
          loadAs: clientAccount,
        });

        assertLoaded(loadedMap);
        expect(loadedMap.name.$isLoaded).toBe(true);
        expect(loadedMap.name.toUpperCase()).toBe("TEST");
      });

      test("for CoRecord", async () => {
        const TestRecord = co.record(z.string(), co.plainText());

        const TestRecordWithName = TestRecord.resolved({
          name: true,
        });

        const record = TestRecordWithName.create(
          {
            name: "Test",
          },
          publicGroup,
        );

        const loadedRecord = await TestRecordWithName.load(record.$jazz.id, {
          loadAs: clientAccount,
        });

        assertLoaded(loadedRecord);
        expect(loadedRecord.name?.$isLoaded).toBe(true);
        expect(loadedRecord.name?.toUpperCase()).toBe("TEST");
      });

      test("for CoList", async () => {
        const TestList = co.list(co.plainText());

        const TestListWithItems = TestList.resolved({
          $each: true,
        });

        const list = TestListWithItems.create(["Test", "Test2"], publicGroup);

        const loadedList = await TestListWithItems.load(list.$jazz.id, {
          loadAs: clientAccount,
        });

        assertLoaded(loadedList);
        expect(loadedList.length).toBe(2);
        expect(loadedList[0]?.$isLoaded).toBe(true);
        expect(loadedList[0]?.toUpperCase()).toBe("TEST");
      });

      // TODO fix - this is not working when providing an explicit resolve query either:
      // TestFeed.load(feed.$jazz.id, {
      //   loadAs: clientAccount,
      //   resolve: {
      //     $each: true,
      //   },
      // })
      test.skip("for CoFeed", async () => {
        const TestFeed = co.feed(co.plainText());

        const TestFeedWithItems = TestFeed.resolved({
          $each: true,
        });

        const feed = TestFeedWithItems.create(["Test"], publicGroup);

        const loadedFeed = await TestFeedWithItems.load(feed.$jazz.id, {
          loadAs: clientAccount,
        });

        assertLoaded(loadedFeed);
        expect(loadedFeed.inCurrentSession?.value.$jazz.loadingState).toBe(
          CoValueLoadingState.LOADED,
        );
        expect(loadedFeed.inCurrentSession?.value.toUpperCase()).toEqual(
          "HELLO",
        );
      });

      test("for Account", async () => {
        const AccountWithProfile = co.account().resolved({
          profile: true,
        });

        const account = await AccountWithProfile.createAs(serverAccount, {
          creationProps: { name: "Hermes Puggington" },
        });
        account.$jazz.set(
          "profile",
          co.profile().create({ name: "Hermes Puggington" }, publicGroup),
        );

        const loadedAccount = await AccountWithProfile.load(account.$jazz.id, {
          loadAs: clientAccount,
        });

        assertLoaded(loadedAccount);
        expect(loadedAccount.profile.$isLoaded).toBe(true);
        expect(loadedAccount.profile.name).toBe("Hermes Puggington");
      });
    });

    test("works with recursive schemas", async () => {
      const Person = co.map({
        get friends(): co.List<typeof Person> {
          return co.list(Person);
        },
      });

      const PersonWithFriends = Person.resolved({
        friends: { $each: true },
      });

      const person = Person.create(
        {
          friends: [{ friends: [] }],
        },
        publicGroup,
      );

      const loadedPerson = await PersonWithFriends.load(person.$jazz.id, {
        loadAs: clientAccount,
      });

      assertLoaded(loadedPerson);
      expect(loadedPerson.friends.$isLoaded).toBe(true);
      expect(loadedPerson.friends.length).toBe(1);
      expect(loadedPerson.friends[0]?.friends.$isLoaded).toBe(false);
    });
  });
});
