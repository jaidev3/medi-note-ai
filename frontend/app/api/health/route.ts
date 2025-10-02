// Health check endpoint for frontend
export async function GET() {
  return Response.json(
    {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "echo-notes-frontend",
      version: "1.0.0",
    },
    { status: 200 }
  );
}
