import { jazzServerAccount } from "@/jazzServerAccount";
import { Game, PlaySelection, playRequest } from "@/schema";
import { Group } from "jazz-tools";

export async function POST(request: Request) {
  const response = await playRequest.handle(
    request,
    jazzServerAccount.worker,
    // @ts-expect-error - FIX THIS
    async ({ game: inputGame, selection }, madeBy) => {
      const game = await Game.load(inputGame.id, {
        loadAs: jazzServerAccount.worker,
        resolve: {
          player1: {
            account: true,
            playSelection: {
              group: true,
            },
          },
          player2: {
            account: true,
            playSelection: {
              group: true,
            },
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

      const group = Group.create({ owner: jazzServerAccount.worker });
      group.addMember(madeBy, "reader");

      const playSelection = PlaySelection.create(
        { value: selection, group },
        group,
      );

      if (isPlayer1) {
        game.player1.playSelection = playSelection;
      } else {
        game.player2.playSelection = playSelection;
      }

      // TODO: For some reason, the autoload for playSelection is not syncronous after the set
      // So working around the issue by reading it from the playSelection var.
      const player1PlaySelection = isPlayer1
        ? playSelection
        : game.player1.playSelection;
      const player2PlaySelection = isPlayer2
        ? playSelection
        : game.player2.playSelection;

      if (player1PlaySelection && player2PlaySelection) {
        game.outcome = determineOutcome(
          player1PlaySelection.value,
          player2PlaySelection.value,
        );
        // Reveal the play selections to the other player
        player1PlaySelection.group.addMember(game.player2.account, "reader");
        player2PlaySelection.group.addMember(game.player1.account, "reader");
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

/**
 * Given a player selections, returns the winner of the current game.
 */
function determineOutcome(
  player1Choice: "rock" | "paper" | "scissors",
  player2Choice: "rock" | "paper" | "scissors",
) {
  if (player1Choice === player2Choice) {
    return "draw";
  } else if (
    (player1Choice === "rock" && player2Choice === "scissors") ||
    (player1Choice === "paper" && player2Choice === "rock") ||
    (player1Choice === "scissors" && player2Choice === "paper")
  ) {
    return "player1";
  } else {
    return "player2";
  }
}
