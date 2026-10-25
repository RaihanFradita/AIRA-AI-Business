const AGENT_TIMEOUT_MS = 125_000;
const MAX_CONCURRENT_AGENTS = 2;
const MAX_QUEUED_AGENTS = 4;
const MAX_ANSWER_LENGTH = 12_000;

const pythonAdapter = `import contextlib, json, sys
try:
    with contextlib.redirect_stdout(sys.stderr):
        import agent
        request = json.load(sys.stdin)
        answer = agent.run(request["message"], log=lambda _message: None)
    sys.stdout.write(json.dumps({"answer": str(answer)[:${MAX_ANSWER_LENGTH}]}, ensure_ascii=False))
except BaseException:
    raise
`;

export class AgentBusyError extends Error {}
export class AgentTimeoutError extends Error {}
export class AgentUnavailableError extends Error {}

class AgentQueue {
  private active = 0;
  private waiting: Array<() => void> = [];

  async run<T>(task: () => Promise<T>): Promise<T> {
    if (this.active >= MAX_CONCURRENT_AGENTS) {
      if (this.waiting.length >= MAX_QUEUED_AGENTS) throw new AgentBusyError();
      await new Promise<void>((resolve) => this.waiting.push(resolve));
    }

    this.active++;
    try {
      return await task();
    } finally {
      this.active--;
      this.waiting.shift()?.();
    }
  }
}

const queue = new AgentQueue();

async function invokePython(message: string): Promise<string> {
  const python = process.env.PYTHON_EXECUTABLE || (process.platform === "win32" ? "python" : "python3");
  let child: ReturnType<typeof Bun.spawn>;

  try {
    child = Bun.spawn([python, "-c", pythonAdapter], {
      cwd: fileURLToPath(new URL("../../", import.meta.url)),
      stdin: "pipe",
      stdout: "pipe",
      stderr: "ignore",
    });
  } catch {
    throw new AgentUnavailableError();
  }

  child.stdin.write(JSON.stringify({ message }));
  child.stdin.end();

  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    child.kill();
  }, AGENT_TIMEOUT_MS);

  try {
    const [exitCode, output] = await Promise.all([
      child.exited,
      new Response(child.stdout).text(),
    ]);
    if (timedOut) throw new AgentTimeoutError();
    if (exitCode !== 0) throw new AgentUnavailableError();

    const result = JSON.parse(output) as { answer?: unknown };
    if (typeof result.answer !== "string" || !result.answer.trim()) throw new AgentUnavailableError();
    return result.answer;
  } catch (error) {
    if (error instanceof AgentTimeoutError || error instanceof AgentUnavailableError) throw error;
    if (timedOut) throw new AgentTimeoutError();
    throw new AgentUnavailableError();
  } finally {
    clearTimeout(timeout);
  }
}

export function runAgent(message: string): Promise<string> {
  return queue.run(() => invokePython(message));
}
import { fileURLToPath } from "node:url";

