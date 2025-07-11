import { jazzServerAccount } from "@/jazzServerAccount";
import { WaitingRoom, createGameRequest } from "@/schema";
import { Group } from "jazz-tools";

export async function POST(request: Request) {
  const response = await createGameRequest.handle(
    request,
    jazzServerAccount.worker,
    async (_, madeBy) => {
      const waitingRoomGroup = Group.create({
        owner: jazzServerAccount.worker,
      });
      waitingRoomGroup.addMember("everyone", "reader");
      const waitingRoom = WaitingRoom.create(
        { account1: madeBy },
        waitingRoomGroup,
      );

      return waitingRoom;
    },
  );

  return response;
}
