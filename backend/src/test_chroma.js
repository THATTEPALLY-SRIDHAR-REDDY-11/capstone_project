import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const headers = {
  "X-Chroma-Token": process.env.CHROMA_API_KEY
};

function chromaBaseUrl() {
  return process.env.CHROMA_API_URL?.replace(/\/+$/, "");
}

function chromaV2DatabaseUrl() {
  const tenant = encodeURIComponent(process.env.CHROMA_TENANT || "");
  const database = encodeURIComponent(process.env.CHROMA_DATABASE || "");
  return `${chromaBaseUrl()}/api/v2/tenants/${tenant}/databases/${database}`;
}

async function run() {
  console.log("Chroma Config:");
  console.log("URL:", process.env.CHROMA_API_URL);
  console.log("Tenant:", process.env.CHROMA_TENANT);
  console.log("Database:", process.env.CHROMA_DATABASE);
  console.log("Token:", process.env.CHROMA_API_KEY ? `${process.env.CHROMA_API_KEY.substring(0, 8)}...` : "None");

  const v2DbUrl = chromaV2DatabaseUrl();
  console.log("V2 DB URL:", v2DbUrl);

  // 1. Try to get collections
  try {
    console.log("Attempting to get collections list from Chroma...");
    const url = `${v2DbUrl}/collections`;
    console.log("Requesting GET:", url);
    const res = await axios.get(url, { headers });
    console.log("Collections list response status:", res.status);
    console.log("Collections data:", res.data);
  } catch (err) {
    console.error("Failed GET /collections:");
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Headers:", err.response.headers);
      console.error("Data:", err.response.data);
    } else {
      console.error(err.message);
    }
  }

  // 2. Try simple v1 heartbeat/version to test basic connectivity
  try {
    console.log("Checking Chroma version (v1)...");
    const v1Url = `${chromaBaseUrl()}/api/v1/version`;
    const res = await axios.get(v1Url, { headers });
    console.log("Version response:", res.data);
  } catch (err) {
    console.error("Failed GET /api/v1/version:", err.message);
  }
}

run().catch(console.error);
