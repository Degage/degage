import { logger } from '@/lib/logger';
import { searchAvailableSharedCars } from '@/actions/shared-car/search';
import { sharedCarSearchPeriodSchema } from '@/domain/shared-car-search.model';
import { PlayConnectorActionError } from '@/domain/play-connector.errors';
import { PlayConnectorError } from '@/play-connector/errors';
import { responseFromCaughtError, safeParseRequestJson } from '@/api/utils';
import { statusCodes } from '@/api/status-codes';
import { withAuth } from '@/api/with-context';

export const POST = withAuth(async (request, _context, session) => {
  const parsed = await safeParseRequestJson(request);
  if (parsed.errorResponse) return parsed.errorResponse;
  const period = sharedCarSearchPeriodSchema.safeParse(parsed.data);
  if (!period.success) {
    return Response.json({ code: 'validation_error', errors: period.error.issues }, { status: statusCodes.BAD_REQUEST });
  }

  try {
    const cars = await searchAvailableSharedCars(session.user.id, period.data);
    return Response.json({ cars });
  } catch (error) {
    const mapped = responseFromCaughtError(error);
    if (mapped) return mapped;
    if (error instanceof PlayConnectorActionError) {
      logger.error('[car-sharing] search failed', { code: error.code, message: error.message });
      const status =
        error.code === 'not_configured' || error.code === 'credentials_invalid' ? statusCodes.BAD_REQUEST : statusCodes.INTERNAL_SERVER_ERROR;
      return Response.json({ code: error.code, errors: [{ message: error.message }] }, { status });
    }
    if (error instanceof PlayConnectorError) {
      logger.error('[car-sharing] search failed', { code: error.code, message: error.message });
      return Response.json({ code: error.code, errors: [{ message: error.message }] }, { status: statusCodes.INTERNAL_SERVER_ERROR });
    }
    logger.exception(error, { route: 'POST /api/car-sharing/search' });
    return Response.json(
      { code: 'internal_error', errors: [{ message: 'An unexpected error occurred' }] },
      { status: statusCodes.INTERNAL_SERVER_ERROR },
    );
  }
});
