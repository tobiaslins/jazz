import { Metric } from "effect";

export const ConnectionsCounter = Metric.counter("connections_counter", {
  description: "A counter for concurrent connections to a server",
});

export const MessagesCounter = Metric.counter("messages_counter", {
  description: "A counter for messages sent",
});

export const MessageTypeFrequency = Metric.frequency("message_type_frequency");
