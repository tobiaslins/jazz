import { jazzServerAccount } from "@/jazzServerAccount";
import { serverApi } from "@/serverApi";

export async function POST(request: Request) {
  const response = await serverApi.newGame.handle(
    request,
    jazzServerAccount.worker,
    async ({ game }, madeBy) => {
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
      };
    },
  );

  return response;
}
