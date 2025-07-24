import { jazzServerAccount } from "@/jazzServerAccount";
import { Game, Player } from "@/schema";
import { serverApi } from "@/serverApi";
import { Account, Group, JazzRequestError } from "jazz-tools";

export async function POST(request: Request) {
  return serverApi.joinGame.handle(
    request,
    jazzServerAccount.worker,
    async ({ waitingRoom }, madeBy) => {
      if (madeBy.id === waitingRoom.creator.id) {
        throw new JazzRequestError("You can't join your own waiting room", 400);
      }

      waitingRoom.game = createGame({
        account1: waitingRoom.creator,
        account2: madeBy,
        worker: jazzServerAccount.worker,
      });

      return {
        waitingRoom,
      };
    },
  );
}

interface CreateGameParams {
  account1: Account;
  account2: Account;
  worker: Account;
}

function createGame({ account1, account2, worker }: CreateGameParams) {
  const gameGroup = Group.create({ owner: worker });
  gameGroup.addMember(account1, "reader");
  gameGroup.addMember(account2, "reader");

  const player1 = createPlayer({ account: account1, owner: gameGroup });
  const player2 = createPlayer({ account: account2, owner: gameGroup });

  const game = Game.create(
    {
      player1: player1,
      player2: player2,
      player1Score: 0,
      player2Score: 0,
    },
    gameGroup,
  );

  return game;
}

interface CreatePlayerParams {
  account: Account;
  owner: Group;
}

function createPlayer({ account, owner }: CreatePlayerParams) {
  const player = Player.create(
    {
      account,
    },
    owner,
  );

  return player;
}
