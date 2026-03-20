export type PaymentGuardPayload = {
  statusCode?: number;
  message?: string;
  requiresUpgrade?: boolean;
  requiresRenewal?: boolean;
  upgradeUrl?: string;
  remaining?: number;
};

export async function parsePaymentGuardError(
  res: Response
): Promise<PaymentGuardPayload | null> {
  if (res.status !== 402) return null;

  try {
    const json = (await res.json()) as PaymentGuardPayload;
    return {
      statusCode: json?.statusCode ?? 402,
      message: json?.message,
      requiresUpgrade: Boolean(json?.requiresUpgrade),
      requiresRenewal: Boolean(json?.requiresRenewal),
      upgradeUrl: json?.upgradeUrl,
      remaining: json?.remaining,
    };
  } catch {
    const text = await res.text().catch(() => "");
    return {
      statusCode: 402,
      message: text || "Yeu cau nang cap goi de tiep tuc.",
      requiresUpgrade: true,
    };
  }
}

