import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const cpuUsage = Math.random() * 100;
    const memoryUsage = Math.random() * 100;
    const diskUsage = Math.random() * 100;
    const networkIn = Math.random() * 1000;
    const networkOut = Math.random() * 1000;

    const metrics = {
      cpu: {
        usage: parseFloat(cpuUsage.toFixed(2)),
        cores: 4,
        loadAverage: [
          parseFloat((Math.random() * 2).toFixed(2)),
          parseFloat((Math.random() * 2).toFixed(2)),
          parseFloat((Math.random() * 2).toFixed(2)),
        ],
      },
      memory: {
        usage: parseFloat(memoryUsage.toFixed(2)),
        total: 8192,
        used: parseFloat((8192 * memoryUsage / 100).toFixed(2)),
        free: parseFloat((8192 * (100 - memoryUsage) / 100).toFixed(2)),
      },
      disk: {
        usage: parseFloat(diskUsage.toFixed(2)),
        total: 512000,
        used: parseFloat((512000 * diskUsage / 100).toFixed(2)),
        free: parseFloat((512000 * (100 - diskUsage) / 100).toFixed(2)),
      },
      network: {
        in: parseFloat(networkIn.toFixed(2)),
        out: parseFloat(networkOut.toFixed(2)),
      },
      uptime: Math.floor(Math.random() * 1000000),
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(metrics), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
