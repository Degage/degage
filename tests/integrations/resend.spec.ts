import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sendMock = vi.fn();

vi.mock('resend', () => ({
  Resend: vi.fn(function Resend() {
    return { emails: { send: sendMock } };
  }),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    exception: vi.fn(),
  },
}));

describe('integrations/resend', () => {
  const originalApiKey = process.env.RESEND_API_KEY;

  beforeEach(() => {
    vi.resetModules();
    sendMock.mockReset();
    process.env.RESEND_API_KEY = 're_test';
  });

  afterEach(() => {
    process.env.RESEND_API_KEY = originalApiKey;
    vi.clearAllMocks();
  });

  it('logs and returns null id when Resend returns an error', async () => {
    sendMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid API key', name: 'validation_error', statusCode: 401 },
    });

    const { sendResendTemplateEmail } = await import('@/integrations/resend');
    const { logger } = await import('@/lib/logger');

    const result = await sendResendTemplateEmail({
      to: 'owner@example.com',
      templateId: 'button-email',
      variables: { BUTTON_URL: 'https://example.com' },
    });

    expect(result).toEqual({ id: null });
    expect(logger.error).toHaveBeenCalledWith('[resend] failed to send email', {
      message: 'Invalid API key',
      name: 'validation_error',
      statusCode: 401,
      to: 'owner@example.com',
      templateId: 'button-email',
    });
  });

  it('logs and throws when throwOnError is true', async () => {
    sendMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid API key', name: 'validation_error', statusCode: 401 },
    });

    const { sendResendTemplateEmail } = await import('@/integrations/resend');
    const { ResendRequestError } = await import('@/integrations/resend-request.error');
    const { logger } = await import('@/lib/logger');

    await expect(
      sendResendTemplateEmail({
        to: 'owner@example.com',
        templateId: 'button-email',
        variables: { BUTTON_URL: 'https://example.com' },
        throwOnError: true,
      }),
    ).rejects.toBeInstanceOf(ResendRequestError);

    expect(logger.error).toHaveBeenCalledWith('[resend] failed to send email', {
      message: 'Invalid API key',
      name: 'validation_error',
      statusCode: 401,
      to: 'owner@example.com',
      templateId: 'button-email',
    });
  });

  it('does not log when the send succeeds', async () => {
    sendMock.mockResolvedValueOnce({
      data: { id: 'email-1' },
      error: null,
    });

    const { sendEmail } = await import('@/integrations/resend');
    const { logger } = await import('@/lib/logger');

    const result = await sendEmail({
      to: 'owner@example.com',
      subject: 'Hello',
      text: 'Hi',
    });

    expect(result).toEqual({ id: 'email-1' });
    expect(logger.error).not.toHaveBeenCalled();
  });
});
