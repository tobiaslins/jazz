import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WORKER_ID } from "@/constants";
import { Game, PlayIntent, Player } from "@/schema";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Group, type ID, InboxSender } from "jazz-tools";
import { useEffect, useState } from "react";

const playIcon = (selection: string) => {
  switch (selection) {
    case "jazz":
      return "🎷";
    case "paper":
      return "📃";
    case "scissors":
      return "✂️";
    default:
      return "❓";
  }
};

export const Route = createFileRoute("/_authenticated/game/$gameId")({
  component: RouteComponent,
  loader: async ({ context: { me }, params: { gameId } }) => {
    const game = await Game.load(gameId as ID<Game>, {
      resolve: {
        player1: true,
        player2: true,
        activePlayer: true,
      },
    });
    if (!game) {
      throw redirect({ to: "/" });
    }

    return { game, gameId, me };
  },
});

function RouteComponent() {
  const { game, gameId, me } = Route.useLoaderData();

  const [playSelection, setPlaySelection] = useState("");
  const [opponentSelection, setOpponentSelection] = useState("");
  const [playSubmitted, setPlaySubmitted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);

  const isPlayer1 = game.player1?.account?.isMe;

  const player = isPlayer1 ? "player1" : "player2";

  const onSubmit = async (playSelection: string) => {
    const sender = await InboxSender.load<PlayIntent, Game>(WORKER_ID, me);
    sender.sendMessage(
      PlayIntent.create(
        { type: "play", gameId, player, playSelection },
        { owner: Group.create({ owner: me }) },
      ),
    );
    setPlaySubmitted(true);
  };

  // should we allow for rounds of play? best 2/3? if so, add a scoreboard?
  //   const onRematch = () => {
  //     setPlaySelection("");
  //     setOpponentSelection("");
  //     setPlaySubmitted(false);
  //     setGameComplete(false);
  //   };

  useEffect(() => {
    if (!game) {
      return;
    }
    return game.subscribe(
      {
        // player1: {}, player2: {}, activePlayer: {}, outcome
      },
      async () => {
        if (game.outcome) {
          setGameComplete(true);
          const currentPlayer = game[player];
          if (!currentPlayer) {
            console.error("Current player not found");
            return;
          }
          const opponent: Player = await game.getOpponent(currentPlayer);
          setOpponentSelection(opponent.playSelection || "");
        }
      },
    );
  }, [game, isPlayer1]);

  return (
    <Card className="mx-auto max-w-5xl">
      <div className="mx-auto text-center">
        <CardHeader>
          <CardTitle>Jazz, Paper, Scissors!</CardTitle>
          <span>Welcome {isPlayer1 ? "Player 1" : "Player 2"}</span>
        </CardHeader>
        {gameComplete ? (
          <div className="border">Game Over, {game?.outcome}</div>
        ) : null}
        <CardContent>
          <div>
            {playSelection === "" ? "Make Your Selection" : "Your Selection: "}
          </div>
          <div className="sm-card flex flex-col gap-6 rounded-xl border py-6 shadow-sm m-4">
            {playIcon(playSelection)}
          </div>
          {gameComplete ? null : ( // <Button onClick={onRematch}>Rematch?</Button>
            <>
              <dl className="grid grid-cols-1 gap-x-8 gap-y-16 text-center lg:grid-cols-3">
                <Button
                  variant={"outline"}
                  size={"icon"}
                  onClick={() => setPlaySelection("jazz")}
                >
                  🎷
                </Button>
                <Button
                  variant={"outline"}
                  size={"icon"}
                  onClick={() => setPlaySelection("paper")}
                >
                  📃
                </Button>
                <Button
                  variant={"outline"}
                  size={"icon"}
                  onClick={() => setPlaySelection("scissors")}
                >
                  ✂️
                </Button>
              </dl>
              <div className="m-4">
                <Button
                  disabled={playSelection === "" || playSubmitted}
                  onClick={() => onSubmit(playSelection)}
                >
                  Go!
                </Button>
              </div>
            </>
          )}
          <div>Your Opponent Selected:</div>
          <div className="sm-card flex flex-col gap-6 rounded-xl border py-6 shadow-sm m-4">
            {playIcon(opponentSelection)}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
