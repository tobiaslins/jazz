import { co, z } from "jazz-tools";

export const Message = co.map({
  text: z.string(),
  // image: z.optional(ImageDefinition),
});

export const Chat = co.list(Message);
