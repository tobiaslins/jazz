import { animated, to, useSpring } from "@react-spring/web";

interface UserCursorProps {
  position: { x: number; y: number };
  color: string;
  isDragging: boolean;
  isRemote: boolean;
}

export function UserCursor({
  position,
  color,
  isDragging,
  isRemote,
}: UserCursorProps) {
  const springs = useSpring({
    x: position.x,
    y: position.y,
    immediate: !isRemote,
    config: {
      tension: 170,
      friction: 26,
    },
  });

  return (
    <animated.polygon
      points="0,0 0,20 14.3,14.3"
      fill={
        isDragging ? color : `color-mix(in oklch, ${color}, transparent 56%)`
      }
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      transform={to(
        [springs.x, springs.y],
        (x: number, y: number) => `translate(${x}, ${y})`,
      )}
    />
  );
}
