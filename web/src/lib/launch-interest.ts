import {
  LaunchInterestSchema,
  type LaunchInterest,
} from "../schemas/launch-interest";

const STORAGE_KEY = "world2.launchInterest";

export type LaunchInterestStorage = Pick<Storage, "getItem" | "setItem">;

export type RegisterLaunchInterestOptions = {
  storage: LaunchInterestStorage;
  interest: LaunchInterest;
};

export type RegisterLaunchInterestResult =
  | { ok: true; interest: LaunchInterest }
  | { ok: false; reason: string };

export type ListLaunchInterestOptions = {
  storage: LaunchInterestStorage;
};

const readList = (storage: LaunchInterestStorage): LaunchInterest[] => {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw === null) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.flatMap((row) => {
      const result = LaunchInterestSchema.safeParse(row);
      if (!result.success) {
        return [];
      }
      const interest: LaunchInterest =
        result.data.name === undefined
          ? { email: result.data.email }
          : { email: result.data.email, name: result.data.name };
      return [interest];
    });
  } catch {
    return [];
  }
};

export const listLaunchInterest = (
  options: ListLaunchInterestOptions
): LaunchInterest[] => {
  return readList(options.storage);
};

export const registerLaunchInterest = (
  options: RegisterLaunchInterestOptions
): RegisterLaunchInterestResult => {
  const parsed = LaunchInterestSchema.safeParse(options.interest);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "Enter an email so we can tell you when World 2 launches.",
    };
  }

  const interest: LaunchInterest =
    parsed.data.name === undefined
      ? { email: parsed.data.email }
      : { email: parsed.data.email, name: parsed.data.name };

  const next = [...readList(options.storage), interest];
  options.storage.setItem(STORAGE_KEY, JSON.stringify(next));
  return { ok: true, interest };
};
