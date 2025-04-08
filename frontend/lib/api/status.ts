import { apiClient } from '@/lib/api-client';
import axios from "axios";

export async function checkDiaryStatus() {
  try {
    const response = await apiClient.get("/diaries/status");
    return response.data;
  } catch (error) {
    console.error("Error checking diary status:", error);
    throw error;
  }
}

export async function checkMessageStatus() {
  try {
    const response = await apiClient.get("/message/status");
    return response.data;
  } catch (error) {
    console.error("Error checking message status:", error);
    throw error;
  }
}
