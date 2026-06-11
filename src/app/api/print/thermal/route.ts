import { execFile } from "node:child_process";
import { spawn } from "node:child_process";
import { promisify } from "node:util";
import { buildEscPosReceipt, type ReceiptData } from "@/lib/thermal-print";

const execFileAsync = promisify(execFile);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PrintPayload = {
  receipt: ReceiptData;
  printerName?: string | null;
};

async function getInstalledPrinters() {
  const { stdout } = await execFileAsync("lpstat", ["-e"]);
  return stdout
    .split("\n")
    .map((name) => name.trim())
    .filter(Boolean);
}

async function getDefaultPrinter() {
  try {
    const { stdout } = await execFileAsync("lpstat", ["-d"]);
    const match = stdout.match(/system default destination:\s*(.+)\s*$/i);
    return match?.[1]?.trim() || null;
  } catch {
    return null;
  }
}

function printRaw(printerName: string | null, data: Uint8Array) {
  return new Promise<void>((resolve, reject) => {
    const args = printerName ? ["-d", printerName, "-o", "raw"] : ["-o", "raw"];
    const lp = spawn("lp", args, { stdio: ["pipe", "pipe", "pipe"] });

    let stderr = "";
    lp.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    lp.on("error", reject);
    lp.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(stderr.trim() || `lp keluar dengan kode ${code}`));
    });

    lp.stdin.end(Buffer.from(data));
  });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<PrintPayload>;
    if (!payload.receipt) {
      return Response.json({ error: "Payload struk tidak lengkap." }, { status: 400 });
    }

    let requestedPrinter = payload.printerName?.trim() || null;
    const printers = await getInstalledPrinters();

    if (requestedPrinter) {
      if (!printers.includes(requestedPrinter)) {
        return Response.json(
          { error: `Printer "${requestedPrinter}" tidak terdaftar di macOS.` },
          { status: 404 },
        );
      }
    } else {
      requestedPrinter = (await getDefaultPrinter()) ?? printers[0] ?? null;
    }

    await printRaw(requestedPrinter, buildEscPosReceipt(payload.receipt));
    return Response.json({ ok: true, printerName: requestedPrinter });
  } catch (error) {
    return Response.json(
      {
        error: "Gagal mencetak lewat printer lokal.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
