export default async function globalSetup(): Promise<void> {
  // Ensure that tests always run in the same time zone regardless of the machine's time zone:
  process.env.TZ = 'UTC';
}
