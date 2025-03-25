import { useAccount, useCoState } from "jazz-react";
import { ID } from "jazz-tools";
import { useCallback, useMemo } from "react";
import { CursorFeed } from "../schema";
import { mappedColor } from "../utils/mappedColor";
import { getName } from "../utils/mappedNickname";
import Canvas from "./Canvas";

/** A higher order component that wraps the canvas. */
function Container({ cursorFeedID }: { cursorFeedID: ID<CursorFeed> }) {
  const { me } = useAccount();
  const cursors = useCoState(CursorFeed, cursorFeedID, []);

  const remoteCursors = useMemo(() => {
    if (!cursors) return [];
    return Object.values(cursors.perSession)
      .filter((entry) => entry.tx.sessionID !== me?.sessionID)
      .map((entry) => ({
        id: entry.tx.sessionID,
        position: {
          x: entry.value.position.x,
          y: entry.value.position.y,
        },
        color: mappedColor(entry.tx.sessionID),
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
