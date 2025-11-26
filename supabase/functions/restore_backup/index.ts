import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.80.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { backupId } = await req.json();

    if (!backupId) {
      return new Response(JSON.stringify({ error: "Backup ID required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: backup, error: backupError } = await supabase
      .from("user_backups")
      .select("*")
      .eq("id", backupId)
      .eq("user_id", user.id)
      .single();

    if (backupError || !backup) {
      return new Response(JSON.stringify({ error: "Backup not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const backupData = backup.backup_data as { files: any[], folders: any[] };

    // Delete all current files and folders for this user
    await supabase
      .from("files")
      .delete()
      .eq("owner_id", user.id);

    await supabase
      .from("folders")
      .delete()
      .eq("owner_id", user.id);

    // Restore folders with exact state from backup
    if (backupData.folders && backupData.folders.length > 0) {
      const foldersToRestore = backupData.folders.map((folder: any) => ({
        id: folder.id,
        folder_name: folder.folder_name,
        parent_id: folder.parent_id,
        owner_id: user.id,
        is_public: folder.is_public,
        starred: folder.starred,
        trashed: folder.trashed || false,
        created_at: folder.created_at,
        updated_at: folder.updated_at,
      }));

      const { error: folderError } = await supabase
        .from("folders")
        .insert(foldersToRestore);

      if (folderError) {
        console.error("Error restoring folders:", folderError);
        throw new Error(`Failed to restore folders: ${folderError.message}`);
      }
    }

    // Restore files with exact state from backup
    if (backupData.files && backupData.files.length > 0) {
      const filesToRestore = backupData.files.map((file: any) => ({
        id: file.id,
        file_name: file.file_name,
        folder_id: file.folder_id,
        owner_id: user.id,
        file_size_mb: file.file_size_mb,
        file_type: file.file_type,
        mime_type: file.mime_type,
        storage_path: file.storage_path,
        is_public: file.is_public,
        starred: file.starred,
        trashed: file.trashed || false,
        created_at: file.created_at,
        updated_at: file.updated_at,
        last_accessed_at: file.last_accessed_at || file.updated_at,
      }));

      const { error: fileError } = await supabase
        .from("files")
        .insert(filesToRestore);

      if (fileError) {
        console.error("Error restoring files:", fileError);
        throw new Error(`Failed to restore files: ${fileError.message}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Backup restored successfully",
        restored: {
          files: backupData.files?.length || 0,
          folders: backupData.folders?.length || 0,
        }
      }),
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
