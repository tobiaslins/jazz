"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Game, newGameRequest, playRequest } from "@/schema";
import { useAccount, useCoState } from "jazz-tools/react";
import { Badge, CircleHelp, Scissors, ScrollText } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const playIcon = (selection: "rock" | "paper" | "scissors" | undefined) => {
  switch (selection) {
    case "rock":
      return <Badge className="w-5 h-5" />;
    case "paper":
      return <ScrollText className="w-5 h-5" />;
    case "scissors":
      return <Scissors className="w-5 h-5" />;
    default:
      return <CircleHelp className="w-5 h-5" />;
  }
};

export default function RouteComponent() {
  const params = useParams<{ id: string }>();
  const game = useCoState(Game, params.id, {
    resolve: {
      player1: {
        account: true,
        playSelection: {
          $onError: null,
        },
      },
      player2: {
        account: true,
        playSelection: {
          $onError: null,
        },
      },
    },
  });

  const isPlayer1 = game?.player1?.account?.isMe;
  const player = isPlayer1 ? "player1" : "player2";

  const [playSelection, setPlaySelection] = useState<
    "rock" | "paper" | "scissors" | undefined
  >(undefined);

  // TODO: This is necessary due to enableSSR. The subscribe/load should be able to default to the current agent.
  const { agent } = useAccount();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    return Game.subscribe(params.id, { loadAs: agent }, (game) => {
      if (game.outcome) {
        setPlaySelection(undefined);
      }
    });
  }, [params.id]);

  if (!game) {
    return null;
  }

  const gameComplete = game.outcome !== undefined;

  const opponent = isPlayer1 ? "player2" : "player1";

  const currentPlayer = game[player];
  const opponentPlayer = game[opponent];

  const opponentSelection = opponentPlayer?.playSelection;

  const onSubmit = async (
    playSelection: "rock" | "paper" | "scissors" | undefined,
  ) => {
    if (!playSelection) return;

    await playRequest.send({
      game,
      selection: playSelection,
    });
  };

  const onNewGame = async () => {
    await newGameRequest.send({
      game,
    });
  };

  const currentPlayerSelection =
    currentPlayer?.playSelection?.value ?? playSelection;

  return (
    <Card className="mx-auto max-w-5xl">
      <div className="mx-auto text-center">
        <CardHeader>
          <CardTitle>Jazz, Paper, Scissors!</CardTitle>
          <span>Welcome {isPlayer1 ? "Player 1" : "Player 2"}</span>
          <span>
            {game?.player1Score ?? 0} - {game?.player2Score ?? 0}
          </span>
        </CardHeader>
        {gameComplete ? (
          <>
            <div className="border">
              Game Over,{" "}
              {game?.outcome === player
                ? "You Win!"
                : game?.outcome === "draw"
                  ? "It's a Draw!"
                  : "You Lose!"}
            </div>
            <Button onClick={onNewGame}>Start a new game</Button>
          </>
        ) : null}
        <CardContent>
          <div>
            {currentPlayerSelection === undefined
              ? "Make Your Selection"
              : "Your Selection: "}
          </div>
          <div>{playIcon(currentPlayerSelection)}</div>
          {gameComplete ? null : (
            <>
              <dl className="grid grid-cols-3 gap-x-8 gap-y-16 text-center">
                <Button
                  variant={"outline"}
                  size={"icon"}
                  onClick={() => setPlaySelection("rock")}
                >
                  <Badge className="w-5 h-5" />
                </Button>
                <Button
                  variant={"outline"}
                  size={"icon"}
                  onClick={() => setPlaySelection("paper")}
                >
                  <ScrollText className="w-5 h-5" />
                </Button>
                <Button
                  variant={"outline"}
                  size={"icon"}
                  onClick={() => setPlaySelection("scissors")}
                >
                  <Scissors className="w-5 h-5" />
                </Button>
              </dl>
              <div className="m-4">
                <Button
                  disabled={
                    playSelection === undefined ||
                    Boolean(currentPlayer?.playSelection)
                  }
                  onClick={() => onSubmit(playSelection)}
                >
                  Go!
                </Button>
              </div>
            </>
          )}
          <div>Your Opponent Selected:</div>
          <div>{playIcon(opponentSelection?.value)}</div>
        </CardContent>
      </div>
    </Card>
  );
}
