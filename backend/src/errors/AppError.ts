export class AppError extends Error {
  public readonly status: number;
  public readonly detalhes?: Record<string, unknown>;

  constructor(message: string, status = 400, detalhes?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.detalhes = detalhes;
  }
}
