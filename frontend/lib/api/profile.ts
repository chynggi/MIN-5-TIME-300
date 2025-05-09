import { apiClient } from "@/lib/api-client";

export const getInterests = async () => {
  const response = await apiClient.get("/user/interests");
  return response.data;
};

export const updateInterests = async (oldInterest: string, newInterest: string) => {
  const response = await apiClient.put("/user/interests", { oldInterest, newInterest });
  return response.data;
};

export const addInterest = async (interest: string) => {
  const response = await apiClient.post("/user/interests", { interest });
  return response.data;
};

export const deleteInterest = async (interest: string) => {
  const response = await apiClient.delete("/user/interests", { data: { interest } });
  return response.data;
};

export const updateProfile = async (mbti: string, interests: string[]) => {
  const response = await apiClient.put("/user/profile", { mbti, interests });
  return response.data;
};