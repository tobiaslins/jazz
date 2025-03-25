import { useAccount, useCoState } from "jazz-react";
import { ID } from "jazz-tools";
import { useCallback, useMemo } from "react";
import { CursorFeed } from "../schema";
import { getColor } from "../utils/getColor";
import { getName } from "../utils/getName";
import Canvas from "./Canvas";

const OLD_CURSOR_AGE_SECONDS = Number(
  import.meta.env.VITE_OLD_CURSOR_AGE_SECONDS,
);

/** A higher order component that wraps the canvas. */
function Container({ cursorFeedID }: { cursorFeedID: ID<CursorFeed> }) {
  const { me } = useAccount();
  const cursors = useCoState(CursorFeed, cursorFeedID, []);

  const remoteCursors = useMemo(() => {
    if (!cursors) return [];
    return Object.values(cursors.perSession)
      .filter((entry) => {
        if (entry.tx.sessionID === me?.sessionID) return false;
        if (
          OLD_CURSOR_AGE_SECONDS &&
          entry.madeAt < new Date(Date.now() - 1000 * OLD_CURSOR_AGE_SECONDS)
        )
          return false;
        return true;
      })
      .map((entry) => ({
        id: entry.tx.sessionID,
        position: {
          x: entry.value.position.x,
          y: entry.value.position.y,
        },
        color: getColor(entry.tx.sessionID),
        isDragging: false,
        isRemote: true,
        name: getName(entry.by?.profile?.name, entry.tx.sessionID),
      }));
  }, [cursors, me]);

  const handleCursorMove = useCallback(
    (move: { position: { x: number; y: number } }) => {
      if (!(cursors && me)) return;
      cursors.push({
        position: {
          x: move.position.x,
          y: move.position.y,
        },
      });
    },
    [me, cursors],
  );

  return (
    <Canvas
      onCursorMove={handleCursorMove}
      remoteCursors={remoteCursors}
      name={getName(me?.profile?.name, me?.sessionID)}
    />
  );
}

export default Container;
