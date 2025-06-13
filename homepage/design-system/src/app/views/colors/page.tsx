import Link from "next/link";
import { ColorTypography } from "../ColorTypography";
import { ViewsLayout } from "../ViewsLayout";

export default function Colors() {
  return (
    <ViewsLayout>
      <h2 id="colors" className="text-xl mt-5 mb-2 font-bold">
        Colors
      </h2>
      <p className="p-1">
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
      <p className="mt-1 p-1">
        Nearly all use cases are encapsulated by harnessing variables which have
        a baked in light & dark mode; meaning there are only a limited number of
        variables which are required for most development.
      </p>

      <h3 id="color-variables" className="text-md mt-4 mb-1 font-bold">
        Color Variables
      </h3>

      <p className="mb-2 p-1">
        The following variables are available and should be used as a preference
        to tailwind classes:
      </p>

      <div className="grid grid-cols-2 gap-2 p-3">
        <div className="bg-primary text-white p-3 rounded-md">Primary</div>
        <div className="bg-secondary text-white p-3 rounded-md">Secondary</div>
        <div className="bg-tip text-white p-3 rounded-md">Tip</div>
        <div className="bg-info text-white p-3 rounded-md">Info</div>
        <div className="bg-success text-white p-3 rounded-md">Success</div>
        <div className="bg-warning text-white p-3 rounded-md">Warning</div>
        <div className="bg-alert text-white p-3 rounded-md">Alert</div>
        <div className="bg-danger text-white p-3 rounded-md">Danger</div>
      </div>
      <p className="text-xs mt-1 mb-4">
        NB: These classes should be used across all apps as the primary an
        secondary colour are updated per app.
        <br />
        <br />
        For full custimisation, the default colours on tailwind are programmed
        to be the tailwind semantic colours, so you can achieve a transparent
        primary with `blue/20`.
      </p>

      <h3 id="text-color-variables" className="text-md mt-4 mb-1 font-bold">
        Text Color Variables
      </h3>

      <div className="grid grid-cols-2 gap-2 my-3 p-3">
        <ColorTypography isDark={false} />
        <ColorTypography isDark={true} />
        <div className="col-span-2">
          <p className="text-xs mb-4 flex justify-end">
            *`text-highlight` and `bg-highlight` are individually set variables
            for each use case meaning they can be combined
          </p>
        </div>
      </div>
    </ViewsLayout>
  );
}
