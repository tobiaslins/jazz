import Link from "next/link";

export function Colors() {
  return (
    <div className="text-default">
      <h2 id="colors" className="text-xl mt-5 mb-2 font-bold">
        Colors
      </h2>
      <p>
        Jazz uses a color palette which extends tailwind classes, with some
        modifications, see{" "}
        <Link
          href="https://tailwindcss.com/docs/colors#using-color-utilities"
          className="text-highlight"
        >
          Tailwind Color Utilities
        </Link>{" "}
        for more infomation on basic usage.
      </p>
      <p className="mt-1">
        Nearly all use cases are encapsulated by harnessing variables which have
        a baked in light & dark mode.
        <br />
        This means there are only a limited number of variables which are
        required for most development.
      </p>

      <h3 id="color-variables" className="text-md mt-4 mb-1 font-bold">
        Color Variables
      </h3>

      <p className="mb-2">
        The following variables are available and should be used as a preference
        to tailwind classes:
      </p>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-primary text-white p-3 rounded-md">Primary</div>
        <div className="bg-secondary text-white p-3 rounded-md">Secondary</div>
        <div className="bg-success text-white p-3 rounded-md">Success</div>
        <div className="bg-warning text-white p-3 rounded-md">Warning</div>
        <div className="bg-error text-white p-3 rounded-md">Error</div>
        <div className="bg-info text-white p-3 rounded-md">Info</div>
      </div>

      <h3 id="text-color-variables" className="text-md mt-4 mb-1 font-bold">
        Text Color Variables
      </h3>

      <div className="grid grid-cols-2 gap-2 my-3">
        <ColorTypography isDark={false} />
        <ColorTypography isDark={true} />
      </div>

      <p>
        *`text-highlight` and `bg-highlight` are individually set variables for
        each use case meaning they can be combined
      </p>
    </div>
  );
}

const ColorTypography = ({ isDark }: { isDark: boolean }) => {
  return (
    <div
      className={`text-default ${isDark ? "dark bg-stone-950" : "bg-stone-100"}`}
    >
      <div className="text-default mb-1">text-default</div>
      <div className="text-muted mb-1">text-muted</div>
      <div className="text-highlight mb-1">text-highlight*</div>
      <div>
        <span className="bg-highlight text-default">bg-highlight*</span>
      </div>
      <div className="text-highlight my-1">
        <span className="bg-highlight">[text+bg]-highlight*</span>
      </div>
    </div>
  );
};
