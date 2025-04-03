export function Grid(
  props: React.HTMLAttributes<HTMLElement> & { cols: 1 | 2 | 3 },
) {
  const { cols, children, ...rest } = props;

  return (
    <div
      {...rest}
      style={{
        gridTemplateColumns: `repeat(<${cols}>, minmax(0, 1fr))`,
        gap: "1rem",
        display: "grid",
      }}
    >
      {children}
    </div>
  );
}
