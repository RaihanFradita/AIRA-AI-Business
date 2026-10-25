export class AppError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export const notFound = (what: string) => new AppError(404, `${what} not found`);
