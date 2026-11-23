import { Resend } from 'resend';
import { ResendRequestError } from '@/integrations/resend-request.error';
import { logger } from '@/lib/logger';

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM ?? 'Neurotic <onboarding@resend.dev>';

const resend = apiKey ? new Resend(apiKey) : null;

export type SendEmailOptions = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  headers?: Record<string, string>;
  replyTo?: string | string[];
  throwOnError?: boolean;
};

export type SendResendTemplateEmailOptions = {
  to: string;
  templateId: string;
  variables: Record<string, string | number>;
  /** If set, overrides the template’s default subject. Omit to use the subject configured in Resend. */
  subject?: string;
  headers?: Record<string, string>;
  replyTo?: string | string[];
  throwOnError?: boolean;
};

/**
 * Send an email via Resend. No-ops if RESEND_API_KEY is not set (e.g. local dev without Resend).
 * Do not await this in auth flows to avoid timing attacks; use void sendEmail(...).
 */
export const getResendClient = (): Resend | null => resend;

const handleResendSendError = (
  error: { message: string; name: string; statusCode: number | null },
  meta: Record<string, unknown>,
  throwOnError: boolean,
): void => {
  logger.error('[resend] failed to send email', {
    message: error.message,
    name: error.name,
    statusCode: error.statusCode,
    ...meta,
  });
  if (throwOnError) {
    throw new ResendRequestError(error.message, error.statusCode ?? 502);
  }
};

export async function sendEmail(options: SendEmailOptions): Promise<{ id: string | null }> {
  if (!resend) return { id: null };
  const result = await resend.emails.send({
    from,
    to: options.to,
    replyTo: options.replyTo,
    subject: options.subject,
    text: options.text,
    html: options.html,
    headers: options.headers,
  });
  if (result.error) {
    handleResendSendError(result.error, { to: options.to }, options.throwOnError ?? false);
  }
  const id = typeof result?.data?.id === 'string' ? result.data.id : null;
  return { id };
}

export async function sendResendTemplateEmail(options: SendResendTemplateEmailOptions): Promise<{ id: string | null }> {
  if (!resend) return { id: null };
  const result = await resend.emails.send({
    from,
    to: options.to,
    replyTo: options.replyTo,
    headers: options.headers,
    ...(options.subject !== undefined ? { subject: options.subject } : {}),
    template: {
      id: options.templateId,
      variables: options.variables,
    },
  });
  if (result.error) {
    handleResendSendError(result.error, { to: options.to, templateId: options.templateId }, options.throwOnError ?? false);
  }
  const id = typeof result?.data?.id === 'string' ? result.data.id : null;
  return { id };
}
