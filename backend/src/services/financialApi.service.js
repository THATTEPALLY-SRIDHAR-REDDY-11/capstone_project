import axios from "axios";

export async function getCompanyMarketData(symbol) {
  if (!symbol || !process.env.FINANCIAL_API_KEY) return null;
  const url = `https://financialmodelingprep.com/api/v3/profile/${encodeURIComponent(symbol)}`;
  const response = await axios.get(url, { params: { apikey: process.env.FINANCIAL_API_KEY } });
  return response.data?.[0] || null;
}
