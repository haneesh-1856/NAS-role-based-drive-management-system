import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing environment variables");
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseServiceKey}`,
      apikey: supabaseServiceKey,
    };

    const listBucketsResponse = await fetch(
      `${supabaseUrl}/storage/v1/b`,
      {
        headers,
      }
    );

    const buckets = await listBucketsResponse.json();
    const filesExist = buckets.some((b: any) => b.name === "files");

    if (!filesExist) {
      const createResponse = await fetch(
        `${supabaseUrl}/storage/v1/b`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: "files",
            public: false,
          }),
        }
      );

      if (!createResponse.ok) {
        throw new Error(
          `Failed to create bucket: ${createResponse.statusText}`
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Storage initialized" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
