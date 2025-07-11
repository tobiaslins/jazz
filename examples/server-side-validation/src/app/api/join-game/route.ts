import { jazzServerAccount } from "@/jazzServerAccount";
import { createGame, joinGameRequest } from "@/schema";

export async function POST(request: Request) {
  const response = await joinGameRequest.handle(
    request,
    jazzServerAccount.worker,
    async (waitingRoom, madeBy) => {
      if (!waitingRoom.account1) {
        return joinGameRequest.schema.response.create(
          {
            waitingRoom,
            result: "error",
            error:
              "Waiting room is missing the player 1 account, you can't join it",
          },
          waitingRoom._owner,
        );
      }

      if (madeBy.id === waitingRoom.account1.id) {
        return joinGameRequest.schema.response.create(
          {
            waitingRoom,
            result: "error",
            error: "You can't join your own waiting room",
          },
          waitingRoom._owner,
        );
      }

      waitingRoom.account2 = madeBy;
      waitingRoom.game = createGame({
        account1: waitingRoom.account1,
        account2: madeBy,
        worker: jazzServerAccount.worker,
      });

      return joinGameRequest.schema.response.create(
        {
          waitingRoom,
          result: "success",
          error: undefined,
        },
        waitingRoom._owner,
      );
    },
  );

  return response;
}
