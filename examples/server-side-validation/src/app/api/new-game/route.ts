import { jazzServerAccount } from "@/jazzServerAccount";
import { Game, newGameRequest } from "@/schema";

export async function POST(request: Request) {
  const response = await newGameRequest.handle(
    request,
    jazzServerAccount.worker,
    // @ts-expect-error - FIX THIS
    async ({ game: inputGame }, madeBy) => {
      const game = await Game.load(inputGame.id, {
        loadAs: jazzServerAccount.worker,
        resolve: {
          player1: {
            account: true,
          },
          player2: {
            account: true,
          },
        },
      });

      if (!game) {
        return {
          game,
          result: "error",
          error: "Unable to load game player data",
        };
      }

      const isPlayer1 = game.player1.account.id === madeBy.id;
      const isPlayer2 = game.player2.account.id === madeBy.id;

      if (!isPlayer1 && !isPlayer2) {
        return {
          game,
          result: "error",
          error: "You are not a player in this game",
        };
      }

      if (game.outcome) {
        game.outcome = undefined;
        game.player1.playSelection = undefined;

        if (game.player2) {
          game.player2.playSelection = undefined;
        }
      }

      return {
        game,
        result: "success",
        error: undefined,
      };
    },
  );

  return response;
}
