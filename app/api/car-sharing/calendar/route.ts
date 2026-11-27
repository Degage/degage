import { logger } from '@/lib/logger';
import { syncSharedCarCalendar } from '@/actions/shared-car/calendar';
import { sharedCarCalendarRequestSchema } from '@/domain/shared-car-calendar.model';
import { PlayConnectorActionError } from '@/domain/play-connector.errors';
import { PlayConnectorError } from '@/play-connector/errors';
import { responseFromCaughtError, safeParseRequestJson } from '@/api/utils';
import { statusCodes } from '@/api/status-codes';
import { withAuth } from '@/api/with-context';

export const POST = withAuth(async (request, _context, session) => {
  const parsed = await safeParseRequestJson(request);
  if (parsed.errorResponse) return parsed.errorResponse;
  const body = sharedCarCalendarRequestSchema.safeParse(parsed.data);
  if (!body.success) {
    return Response.json({ code: 'validation_error', errors: body.error.issues }, { status: statusCodes.BAD_REQUEST });
  }

  try {
    const calendar = await syncSharedCarCalendar(session.user.id, body.data);
    return Response.json(calendar);
  } catch (error) {
    const mapped = responseFromCaughtError(error);
    if (mapped) return mapped;
    if (error instanceof PlayConnectorActionError) {
      logger.error('[car-sharing] calendar failed', { code: error.code, message: error.message });
      const status =
        error.code === 'not_configured' || error.code === 'credentials_invalid' ? statusCodes.BAD_REQUEST : statusCodes.INTERNAL_SERVER_ERROR;
      return Response.json({ code: error.code, errors: [{ message: error.message }] }, { status });
    }
    if (error instanceof PlayConnectorError) {
      logger.error('[car-sharing] calendar failed', { code: error.code, message: error.message });
      return Response.json({ code: error.code, errors: [{ message: error.message }] }, { status: statusCodes.INTERNAL_SERVER_ERROR });
    }
    logger.exception(error, { route: 'POST /api/car-sharing/calendar' });
    return Response.json(
      { code: 'internal_error', errors: [{ message: 'An unexpected error occurred' }] },
      { status: statusCodes.INTERNAL_SERVER_ERROR },
    );
  }
});
