const CAR_SHARING_RETURN_PATH = '/app/car-sharing';

export const playConnectorReturnPath = (value: string | null | undefined): string | null =>
  value === CAR_SHARING_RETURN_PATH ? CAR_SHARING_RETURN_PATH : null;
