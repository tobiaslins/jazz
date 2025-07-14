import { Account, Group, co, experimental_defineRequest, z } from "jazz-tools";

export const PlaySelection = co.map({
  value: z.literal(["rock", "paper", "scissors"]),
  group: Group,
});
export type PlaySelection = co.loaded<typeof PlaySelection>;

export const Player = co.map({
  account: co.account(),
  playSelection: PlaySelection.optional(),
});
export type Player = co.loaded<typeof Player>;

export const Game = co.map({
  player1: Player,
  player2: Player,
  outcome: z.literal(["player1", "player2", "draw"]).optional(),
  player1Score: z.number(),
  player2Score: z.number(),
});
export type Game = co.loaded<typeof Game>;

export const WaitingRoom = co.map({
  creator: co.account(),
  game: z.optional(Game),
});
export type WaitingRoom = co.loaded<typeof WaitingRoom>;

export const createGameRequest = experimental_defineRequest({
  url: "/api/create-game",
  request: co.map({}),
  response: WaitingRoom,
});

export const joinGameRequest = experimental_defineRequest({
  url: "/api/join-game",
  request: {
    schema: WaitingRoom,
    resolve: {
      creator: true,
    },
  },
  response: {
    schema: co.map({
      waitingRoom: WaitingRoom,
      result: z.literal(["success", "error"]),
      error: z.optional(z.string()),
    }),
    resolve: {
      waitingRoom: {
        game: {
          player1: {
            account: true,
          },
          player2: {
            account: true,
          },
        },
      },
    },
  },
});

export const newGameRequest = experimental_defineRequest({
  url: "/api/new-game",
  request: Game,
  response: {
    schema: co.map({
      game: Game,
      result: z.literal(["success", "error"]),
      error: z.optional(z.string()),
    }),
    resolve: {
      game: {
        player1: {
          account: true,
        },
        player2: {
          account: true,
        },
      },
    },
  },
});

export const playRequest = experimental_defineRequest({
  url: "/api/play",
  request: {
    schema: co.map({
      game: Game,
      selection: z.literal(["rock", "paper", "scissors"]),
    }),
    resolve: {
      game: true,
    },
  },
  response: {
    schema: co.map({
      game: Game,
      result: z.literal(["success", "error"]),
      error: z.optional(z.string()),
    }),
    resolve: {
      game: true,
    },
  },
});

interface CreateGameParams {
  account1: Account;
  account2: Account;
  worker: Account;
}

export function createGame({ account1, account2, worker }: CreateGameParams) {
  const publicReadOnly = Group.create({ owner: worker });
  publicReadOnly.addMember(account1, "reader");
  publicReadOnly.addMember(account2, "reader");

  const player1 = createPlayer({ account: account1, worker });
  const player2 = createPlayer({ account: account2, worker });

  const game = Game.create(
    {
      player1: player1,
      player2: player2,
      player1Score: 0,
      player2Score: 0,
    },
    { owner: publicReadOnly },
  );

  return game;
}

interface CreatePlayerParams {
  account: Account;
  worker: Account;
}

function createPlayer({ account, worker }: CreatePlayerParams) {
  const publicRead = Group.create({ owner: worker });
  publicRead.addMember("everyone", "reader");

  const player = Player.create(
    {
      account: account,
    },
    { owner: publicRead },
  );

  return player;
}
