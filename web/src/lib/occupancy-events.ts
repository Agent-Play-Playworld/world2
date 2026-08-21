import {
  WORLD_INTERCOM_SSE,
  WORLD_PLAYER_ADDED_SSE,
} from "../schemas/occupancy-play";
import { occupancyApiBase } from "./occupancy-origin";

export type OccupancyEventSource = {
  addEventListener: (
    type: string,
    listener: (event: MessageEvent<string>) => void
  ) => void;
  close: () => void;
};

export type CreateOccupancyEventSource = (url: string) => OccupancyEventSource;

export const occupancyEventsUrl = (options: {
  origin: string;
  sid: string;
}): string => {
  return `${occupancyApiBase(options.origin)}/events?sid=${encodeURIComponent(options.sid)}`;
};

export const subscribeOccupancyEvents = (options: {
  origin: string;
  sid: string;
  createEventSource?: CreateOccupancyEventSource;
  onEvent: (event: { type: string; data: unknown }) => void;
}): { close: () => void } => {
  const url = occupancyEventsUrl({ origin: options.origin, sid: options.sid });
  const create =
    options.createEventSource ??
    ((eventUrl: string): OccupancyEventSource => new EventSource(eventUrl));
  let source: OccupancyEventSource;
  try {
    source = create(url);
  } catch {
    return { close: () => undefined };
  }
  const listen = (type: string): void => {
    source.addEventListener(type, (event) => {
      try {
        const parsed: unknown = JSON.parse(event.data);
        options.onEvent({ type, data: parsed });
      } catch {
        options.onEvent({ type, data: event.data });
      }
    });
  };
  listen(WORLD_INTERCOM_SSE);
  listen(WORLD_PLAYER_ADDED_SSE);
  return {
    close: () => {
      source.close();
    },
  };
};
