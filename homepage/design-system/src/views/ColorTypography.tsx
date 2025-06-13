import clsx from "clsx";

export const ColorTypography = ({ isDark }: { isDark: boolean }) => {
  return (
    <div
      className={clsx(
        "text-default p-3 rounded-md",
        isDark ? "dark bg-stone-900" : "bg-white",
      )}
    >
      <div className="text-default mb-1">text-default</div>
      <div className="text-muted mb-1">text-muted</div>
      <div className="text-highlight mb-1">text-highlight</div>
      <div>
        <span className="text-default bg-highlight">bg-highlight*</span>
      </div>
      <div className="text-highlight my-1">
        <span className="bg-highlight">[text+bg]-highlight*</span>
      </div>
    </div>
  );
};
