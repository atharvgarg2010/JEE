export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    full_name: string | null;
    username: string;
    roll_number: string | null;
    batch_code: string | null;
    role: string;
  };
  redirectTo?: string;
}

export async function postAuth(
  url: string,
  body: Record<string, string>,
): Promise<AuthResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as AuthResponse;

  if (!response.ok || !data.success) {
    throw new Error(data.error ?? "Something went wrong");
  }

  return data;
}
