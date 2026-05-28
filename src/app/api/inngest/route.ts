import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { analyzeScanJob, generateVTOJob } from "@/inngest/functions";

// Create an API that serves zero-delay background functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    analyzeScanJob,
    generateVTOJob,
  ],
});
