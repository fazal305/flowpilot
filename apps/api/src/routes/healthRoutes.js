export async function healthRoutes(app) {
  app.get("/api/health", async () => ({
    status: "ok",
    time: new Date().toISOString(),
  }));
}
