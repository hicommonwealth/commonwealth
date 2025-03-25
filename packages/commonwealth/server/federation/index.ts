const PORT = process.env.CANVAS_WS_PORT || 3333;
const BASE_URL = `http://localhost:${PORT}`;

class Client {
  clock: number;
  heads: string[];
  baseUrl: string;

  constructor() {
    this.clock = 0;
    this.heads = [];
  }
  async applyCanvasSignedData(path: string, canvasSignedData?: string) {
    if (!canvasSignedData) {
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/dag-json',
        },
        body: canvasSignedData,
      });

      const result = await response.json();

      if (
        !result.success ||
        result.result.clock === undefined ||
        result.result.heads === undefined
      ) {
        throw new Error(result.error || 'Failed to apply canvas signed data');
      }

      this.clock = result.result.clock;
      this.heads = result.result.heads;

      return { session: result.result.session, action: result.result.action };
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  async getClock(): Promise<{ clock: number; heads: string[] }> {
    try {
      const response = await fetch(`${BASE_URL}/clock`);
      const result = await response.json();

      this.clock = result.clock;
      this.heads = result.heads;
      return { clock: this.clock, heads: this.heads };
    } catch (err) {
      console.log('could not fetch latest clock from canvas service');
      return { clock: this.clock, heads: this.heads };
    }
  }
}

export const client = new Client();
