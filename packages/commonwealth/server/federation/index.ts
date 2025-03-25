const PORT = process.env.CANVAS_WS_PORT || 3333;
const BASE_URL = `http://localhost:${PORT}`;

class Client {
  clock: number;
  heads: string[];
  baseUrl: string;

  constructor(rootUrl: string) {
    this.clock = 0;
    this.heads = [];
    this.baseUrl = rootUrl;
  }
  async applyCanvasSignedData(path: string, canvasSignedData: string) {
    const response = await fetch(`${this.baseUrl}/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
  }
  async getClock(): Promise<{ clock: number; heads: string[] }> {
    const response = await fetch(`${this.baseUrl}/clock`);
    const result = await response.json();

    this.clock = result.clock;
    this.heads = result.heads;
    return { clock: this.clock, heads: this.heads };
  }
}

export const client = new Client(BASE_URL);
export const applyCanvasSignedData = client.applyCanvasSignedData;
