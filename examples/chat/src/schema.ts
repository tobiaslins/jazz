import { CoList, CoMap, ImageDefinition, coField } from "jazz-tools";

export class Message extends CoMap {
  text = coField.string;
  image = coField.optional.ref(ImageDefinition);
}

export class Chat extends CoList.Of(coField.ref(Message)) {}
