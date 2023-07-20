import { CoValue } from "./cojsonValue";
import { JsonValue } from "./jsonValue";
import { MultiLog } from "./multilog";
import { LocalNode } from "./node";

type Value = JsonValue | CoValue;

export {
    JsonValue,
    CoValue,
    Value,
    LocalNode,
    MultiLog
}
