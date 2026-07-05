import "dotenv/config";
import { supabaseAdmin, STORAGE_BUCKET } from "../src/lib/storage";

// Creates the public image bucket. Run once: npm run storage:setup
async function main() {
  if (!supabaseAdmin) {
    console.error(
      "Supabase Storage not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.",
    );
    process.exit(1);
  }

  const { data: buckets, error: listErr } =
    await supabaseAdmin.storage.listBuckets();
  if (listErr) {
    console.error("Could not reach Supabase Storage:", listErr.message);
    process.exit(1);
  }

  if (buckets?.some((b) => b.name === STORAGE_BUCKET)) {
    console.log(`Bucket "${STORAGE_BUCKET}" already exists.`);
    return;
  }

  const { error } = await supabaseAdmin.storage.createBucket(STORAGE_BUCKET, {
    public: true,
    fileSizeLimit: "5MB",
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
  });
  if (error) {
    console.error("Failed to create bucket:", error.message);
    process.exit(1);
  }
  console.log(`Created public bucket "${STORAGE_BUCKET}".`);
}

main();
