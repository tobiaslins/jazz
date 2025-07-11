"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { WaitingRoom, joinGameRequest } from "@/schema";
import { Account, co } from "jazz-tools";
import { useCoState } from "jazz-tools/react-core";
import { ClipboardCopyIcon, Loader2Icon } from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function useWindowLocation() {
  const [location, setLocation] = useState<string>("");

  useEffect(() => {
    setLocation(window.location.href);
  }, []);

  return location;
}

async function askToJoinGame(
  waitingRoom: co.loaded<typeof WaitingRoom, { account1: true; game: true }>,
) {
  if (waitingRoom.account1.isMe) {
    return;
  }

  const response = await joinGameRequest.send(waitingRoom);

  if (response.result === "error") {
    console.log(response.error);
  }
}

export default function RouteComponent() {
  const params = useParams<{ id: string }>();
  const waitingRoom = useCoState(WaitingRoom, params.id, {
    resolve: {
      account1: true,
      game: true,
    },
  });
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const location = useWindowLocation();

  useEffect(() => {
    if (!waitingRoom) {
      return;
    }
    askToJoinGame(waitingRoom);
  }, [waitingRoom?.id]);

  useEffect(() => {
    if (!waitingRoom?.game?.id) {
      return;
    }

    router.push(`/game/${waitingRoom.game.id}`);
  }, [waitingRoom?.game?.id]);

  const onCopyClick = () => {
    navigator.clipboard.writeText(window.location.toString());
    setCopied(true);
  };

  return (
    <div className="h-screen flex flex-col w-full place-items-center justify-center p-2">
      <Card className="w-[500px]">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Loader2Icon className="animate-spin inline h-8 w-8 mr-2" />
            Waiting for opponent to join the game
          </CardTitle>
          <CardDescription>
            Share this link with your friend to join the game. The game will
            automatically start once they join.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex">
            <Input
              className="w-full border bg-muted rounded-e-none"
              readOnly
              value={location}
            />
            <Button onClick={onCopyClick} className="rounded-s-none w-25">
              {copied ? (
                "Copied!"
              ) : (
                <>
                  <ClipboardCopyIcon className="w-5 h-5" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
