import type { CitizenshipCredential } from "../schemas/citizenship";
import type { LaunchInterest } from "../schemas/launch-interest";

const TEN_WORD_PASSPHRASE =
  "amber angle apple arch atlas aura autumn bamboo beacon birch";

export const getMockCitizenshipCredential = (
  overrides?: Partial<CitizenshipCredential>
): CitizenshipCredential => {
  return {
    serverUrl: "https://agent-play.com",
    nodeId: "citizen-node-fixture",
    passw: TEN_WORD_PASSPHRASE,
    ...overrides,
  };
};

export const getMockLaunchInterest = (overrides?: {
  email?: string;
  name?: string;
}): LaunchInterest => {
  if (overrides?.name !== undefined) {
    return {
      email: overrides.email ?? "friend@example.com",
      name: overrides.name,
    };
  }
  if (overrides?.email !== undefined) {
    return { email: overrides.email, name: "Ada" };
  }
  return {
    email: "friend@example.com",
    name: "Ada",
  };
};

export { TEN_WORD_PASSPHRASE };
