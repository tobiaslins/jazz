import {
  Game,
  InboxMessage,
  JoinGameRequest,
  Player,
  WaitingRoom,
} from "@/schema";
import { startWorker } from "jazz-nodejs";
import { Account, Group } from "jazz-tools";

const {
  worker,
  experimental: { inbox },
} = await startWorker({
  accountID: process.env.VITE_JAZZ_WORKER_ACCOUNT,
  syncServer: "wss://cloud.jazz.tools/?key=you@example.com",
});

inbox.subscribe(
  InboxMessage,
  async (message, senderID) => {
    const playerAccount = await Account.load(senderID, worker, {});
    if (!playerAccount) {
      return;
    }

    switch (message.type) {
      case "play":
        console.log("play message from", senderID);
        // handlePlayIntent(senderID, message.castAs(PlayIntent));
        break;
      case "createGame":
        console.log("create game message from", senderID);

        const waitingRoomGroup = Group.create({ owner: worker });
        waitingRoomGroup.addMember("everyone", "reader");
        const waitingRoom = WaitingRoom.create(
          { account1: playerAccount },
          { owner: waitingRoomGroup },
        );

        console.log("waiting room created with id:", waitingRoom.id);

        return waitingRoom;
      case "joinGame":
        console.log("join game message from", senderID);
        const joinGameRequest = message.castAs(JoinGameRequest);
        if (
          !joinGameRequest.waitingRoom ||
          !joinGameRequest.waitingRoom.account1
        ) {
          console.error("No waiting room in join game request");
          return;
        }
        joinGameRequest.waitingRoom.account2 = playerAccount;

        const game = await createGame({
          account1: joinGameRequest.waitingRoom.account1,
          account2: joinGameRequest.waitingRoom.account2,
        });
        console.log("game created with id:", game.id);

        joinGameRequest.waitingRoom.game = game;
        return joinGameRequest.waitingRoom;
    }
  },
  { retries: 3 },
);

interface CreateGameParams {
  account1: Account;
  account2: Account;
}
async function createGame({ account1, account2 }: CreateGameParams) {
  const publicReadOnly = Group.create({ owner: worker });
  publicReadOnly.addMember(account1, "reader");
  publicReadOnly.addMember(account2, "reader");

  const player1 = createPlayer({ account: account1 });
  const player2 = createPlayer({ account: account2 });

  const game = Game.create(
    {
      activePlayer: player1,
      player1: player1,
      player2: player2,
    },
    { owner: publicReadOnly },
  );

  await game.waitForSync();

  return game;
}

interface CreatePlayerParams {
  account: Account;
}
function createPlayer({ account }: CreatePlayerParams) {
  const publicRead = Group.create({ owner: worker });
  publicRead.addMember("everyone", "reader");

  const player = Player.create(
    {
      account,
    },
    { owner: publicRead },
  );

  return player;
}
