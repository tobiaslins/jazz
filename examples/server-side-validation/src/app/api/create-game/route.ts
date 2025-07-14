import { jazzServerAccount } from "@/jazzServerAccount";
import { WaitingRoom, createGameRequest } from "@/schema";
import { Group } from "jazz-tools";

export async function POST(request: Request) {
  const response = await createGameRequest.handle(
    request,
    jazzServerAccount.worker,
    async (_, madeBy) => {
      const waitingRoom = WaitingRoom.create(
        { creator: madeBy },
        Group.create(jazzServerAccount.worker).makePublic(),
      );

      return waitingRoom;
    },
  );

  return response;
}
