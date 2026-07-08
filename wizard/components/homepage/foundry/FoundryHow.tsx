const STEPS = [
  {
    num: "01",
    title: "Sign in with Google",
    body:
      "One click. SecretForge provisions your private API key via Secret Labs.",
  },
  {
    num: "02",
    title: "Deploy your agent",
    body:
      "Pick OpenClaw or Hermes and your LLM. Your agent spins up in a SecretVM in minutes.",
  },
  {
    num: "03",
    title: "Connect your tools",
    body:
      "Add Gmail and other connectors. Tokens stay sealed in your enclave. Only you can reach them.",
  },
];

export default function FoundryHow() {
  return (
    <section id="how-it-works" className="fg fghow">
      <div className="fg__wrap">
        <div className="fg__head">
          <span className="fg__eyebrow">The forge process</span>
          <h2 className="fg__h2">Three steps to a sealed agent.</h2>
        </div>

        <ol className="fghow__steps">
          {STEPS.map((step) => (
            <li key={step.num} className="fgstep">
              <span className="fgstep__num">{step.num}</span>
              <span className="fgstep__node" />
              <h3 className="fgstep__t">{step.title}</h3>
              <p className="fgstep__p">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
