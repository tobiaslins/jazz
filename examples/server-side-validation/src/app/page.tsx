"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createGameRequest } from "@/schema";
import { Group, co } from "jazz-tools";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomeComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onNewGameClick = async () => {
    setIsLoading(true);

    const group = Group.create().makePublic();
    const waitingRoom = await createGameRequest.send(
      co.map({}).create({}, group),
    );

    if (!waitingRoom) {
      setIsLoading(false);
      return;
    }
    router.push(`/waiting-room/${waitingRoom.id}`);
  };

  return (
    <div className="h-screen flex flex-col w-full place-items-center justify-center p-2">
      <Card className="w-[500px]">
        <CardHeader>
          <CardTitle>Welcome to Jazz, Paper, Scissors!</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex items-center p-4">
            <Button
              onClick={onNewGameClick}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Creating game..." : "New Game"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
