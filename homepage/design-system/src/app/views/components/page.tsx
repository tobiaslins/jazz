import IconsView from "../IconsView";
import InputsView from "../InputsView";
import { ViewsLayout } from "../ViewsLayout";

export default function ComponentsView() {
  return (
    <ViewsLayout>
      <h2 id="components" className="text-xl mt-5 mb-2 font-bold">
        Components
      </h2>

      <InputsView />
      <IconsView />
    </ViewsLayout>
  );
}
