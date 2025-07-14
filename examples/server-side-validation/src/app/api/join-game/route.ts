import { jazzServerAccount } from "@/jazzServerAccount";
import { createGame, joinGameRequest } from "@/schema";

export async function POST(request: Request) {
  const response = await joinGameRequest.handle(
    request,
    jazzServerAccount.worker,
    async ({ waitingRoom }, madeBy) => {
      if (!waitingRoom.creator) {
        return {
          waitingRoom,
          result: "error",
          error:
            "Waiting room is missing the player 1 account, you can't join it",
        };
      }

      if (madeBy.id === waitingRoom.creator.id) {
        return {
          waitingRoom,
          result: "error",
          error: "You can't join your own waiting room",
        };
      }

      waitingRoom.game = createGame({
        account1: waitingRoom.creator,
        account2: madeBy,
        worker: jazzServerAccount.worker,
      });

      return {
        waitingRoom,
        result: "success",
      };
    },
  );

  return response;
}
