import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getDefaultPrinter() {
  try {
    const { stdout } = await execFileAsync("lpstat", ["-d"]);
    const match = stdout.match(/system default destination:\s*(.+)\s*$/i);
    return match?.[1]?.trim() || null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const [{ stdout }, defaultPrinter] = await Promise.all([
      execFileAsync("lpstat", ["-e"]),
      getDefaultPrinter(),
    ]);

    const printers = stdout
      .split("\n")
      .map((name) => name.trim())
      .filter(Boolean);

    return Response.json({ printers, defaultPrinter });
  } catch (error) {
    return Response.json(
      {
        error: "Tidak bisa membaca daftar printer macOS.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
