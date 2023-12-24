import {
  ControlledAgent,
  LocalNode,
  cojsonInternals,
  cojsonReady,
} from "cojson";
import { SQLiteStorage } from "cojson-storage-sqlite";
// import {
//   websocketReadableStream,
//   websocketWritableStream,
// } from "./websocketStreams.js";
import {
  Console,
  Effect,
  Fiber,
  LogLevel,
  Logger,
  Match,
  Metric,
  Schedule,
  pipe,
} from "effect";
import {
  SocketServer,
  layerWebSocket,
} from "@effect/experimental/SocketServer/Node";
import { Socket } from "@effect/experimental/Socket";
import { ConnectionsCounter, MessageTypeFrequency } from "./metrics.js";
import * as Net from "node:net";

const enc = new TextEncoder();
const dec = new TextDecoder();

process.title = "cojson-sync-server";

const handleClient = (ws: Socket, _localNode: LocalNode) =>
  Effect.gen(function* (_) {
    const source = ws.source as { _socket: Net.Socket };

    const clientAddress = source?._socket?.remoteAddress;

    // const clientId =
    //   clientAddress +
    //   "@" +
    //   new Date().toISOString() +
    //   Math.random().toString(36).slice(2);

    yield* _(Effect.logDebug("New connection"));
    yield* _(Metric.increment(ConnectionsCounter));

    // TODO: Add peer to localNode
    // localNode.syncManager.addPeer({
    //   id: clientId,
    //   role: "client",
    //   incoming: websocketReadableStream(ws),
    //   outgoing: websocketWritableStream(ws),
    // });

    yield* _(
      Effect.fork(
        pipe(
          ws.run,
          Effect.catchTag("SocketError", (e) => {
            const log = pipe(
              Match.value(e.reason),
              Match.when("Close", () => Effect.logDebug(`Socket closed`)),
              Match.when("Read", () => Effect.logDebug(`Socket Read Error`)),
              Match.when("Write", () => Effect.logDebug(`Socket Write Error`)),
              Match.when("Open", () => Effect.logDebug(`Socket Open Error`)),
              Match.exhaustive
            );
            return Effect.all([
              log,
              Metric.incrementBy(ConnectionsCounter, -1),
            ]);
          })
        )
      )
    );

    const writer = yield* _(ws.writer);

    yield* _(
      Effect.fork(
        Effect.repeat(
          pipe(
            writer(enc.encode("ping"))
            //  Effect.tap(() => Effect.logDebug("Ping Sent"))
          ),
          Schedule.spaced("5 seconds")
        )
      )
    );
    const fiber = yield* _(
      ws.messages.take,
      Effect.map((msg) => dec.decode(msg)),
      Effect.map((msg) => JSON.parse(msg) as { action: string }), // use Effect schema
      Effect.tap((msg) =>
        Effect.all([MessageTypeFrequency(Effect.succeed(msg.action))])
      ),
      Effect.forever,
      Effect.fork
    );

    yield* _(Fiber.join(fiber));
  }).pipe(Effect.scoped, Effect.withLogSpan("online_duration"));

const setupCoJson = Effect.gen(function* (_) {
  yield* _(
    Effect.tryPromise({
      try: () => cojsonReady,
      catch: () => Effect.logError("Error waiting for cojson"),
    })
  );
  const agentSecret = cojsonInternals.newRandomAgentSecret();
  const agentID = cojsonInternals.getAgentID(agentSecret);

  const localNode = new LocalNode(
    new ControlledAgent(agentSecret),
    cojsonInternals.newRandomSessionID(agentID)
  );

  yield* _(
    Effect.tryPromise({
      try: () =>
        SQLiteStorage.asPeer({ filename: "./sync.db" }).then((storage) =>
          localNode.syncManager.addPeer(storage)
        ),
      catch: () => Effect.logError("Error opening database"),
    })
  );

  return localNode;
});

const main = Effect.gen(function* (_) {
  const localNode = yield* _(setupCoJson);

  const server = yield* _(SocketServer);

  yield* _(Effect.fork(server.run));
  yield* _(Effect.fork(metricsLogger)); // Run logger in background that prints metrics every second

  const fiber = yield* _(
    server.sockets.take,
    Effect.flatMap((e) => Effect.fork(handleClient(e, localNode))),
    Effect.forever, // take next socket,
    Effect.fork // Run in background
  );

  yield* _(Fiber.join(fiber));
}).pipe(Logger.withMinimumLogLevel(LogLevel.Debug));

const metricsLogger = Effect.repeat(
  Effect.all([
    Metric.value(ConnectionsCounter).pipe(Effect.flatMap(Effect.log)),
    Metric.value(MessageTypeFrequency).pipe(
      Effect.map((e) => e.occurrences),
      Effect.flatMap(Console.log)
    ),
  ]),
  Schedule.spaced("10 seconds")
);

const webSocket = layerWebSocket({
  port: 4200,
});

const runnable = Effect.provide(webSocket)(main);

const res = await Effect.runPromiseExit(runnable);
console.log(res);
