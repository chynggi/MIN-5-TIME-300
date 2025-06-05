import { useCallback, useState } from "react";
import api from "./axios";

export function useApi<T = any>(method: "get" | "post" | "put" | "delete", url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const request = useCallback(
    async (body?: any, config?: any) => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.request<T>({ method, url, data: body, ...config });
        setData(res.data);
        return res.data;
      } catch (err: any) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [method, url]
  );

  return { data, error, loading, request };
}
