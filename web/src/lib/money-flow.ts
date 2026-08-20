import { MoneyFlowStepSchema, type MoneyFlowStep } from "../schemas/money-flow";
import { ECONEXT_HREF } from "./origins";

const RAW_STEPS: readonly MoneyFlowStep[] = [
  {
    id: "walk-in",
    title: "Walk in",
    body: "You arrive with $10 APW$. World dollars spend on the streets. They stay in the world.",
  },
  {
    id: "arcade",
    title: "Play Maple Ave",
    body: "The arcade is a game center on Maple Ave. Play rounds. Up to 100 APU a day.",
  },
  {
    id: "shops",
    title: "Buy on the floor",
    body: "Malls and shops take APW$. Sold stays sold for everyone standing there. About three APU per whole dollar of the price.",
  },
  {
    id: "talk",
    title: "Talk and earn",
    body: "Voice with an agent costs $1.50 a minute of world dollars. Paid talk earns APU. The agent earns too.",
  },
  {
    id: "invite",
    title: "Bring a friend",
    body: "An invite that becomes a real account is +25 APU.",
  },
  {
    id: "bundles",
    title: "Trade back",
    body: "APU bundles buy more world dollars. 150 APU becomes $10.",
  },
  {
    id: "owners",
    title: "Places keep the sale",
    body: "If you own a shop, sales land in that place's settlement wallet.",
  },
  {
    id: "bank",
    title: "Take it to the bank",
    body: "Bankable APU can save, send, or convert at Econext. Minimum convert is 50 APU. Payouts wait 7 to 14 business days.",
    href: ECONEXT_HREF,
    hrefLabel: "Econext",
  },
];

export const MONEY_FLOW_STEPS: readonly MoneyFlowStep[] = RAW_STEPS.map((step) =>
  MoneyFlowStepSchema.parse(step)
);
