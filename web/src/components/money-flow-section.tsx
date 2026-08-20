import { MONEY_FLOW_STEPS } from "../lib/money-flow";

export const MoneyFlowSection = () => {
  return (
    <section className="money-flow" id="money-flow" aria-label="How money moves">
      <p className="reel-kicker">Agent Play network</p>
      <h2>How money moves</h2>
      <p className="lead money-flow-lead">
        One unit everywhere: APU. World dollars (APW$) spend on the streets.
        What you earn can walk to the bank.
      </p>
      <ol className="money-flow-steps">
        {MONEY_FLOW_STEPS.map((step, index) => (
          <li key={step.id} className="money-flow-step">
            <span className="money-flow-index">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
            {step.href !== undefined && step.hrefLabel !== undefined ? (
              <a href={step.href} rel="noreferrer">
                {step.hrefLabel}
              </a>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
};
