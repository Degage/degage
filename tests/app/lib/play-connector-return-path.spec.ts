import { describe, expect, it } from 'vitest';

import { playConnectorReturnPath } from '@/app/lib/play-connector-return-path';

describe('playConnectorReturnPath', () => {
  it('accepts only the car-sharing page', () => {
    expect(playConnectorReturnPath('/app/car-sharing')).toBe('/app/car-sharing');
  });

  it('rejects other paths, protocol-relative URLs, and off-site URLs', () => {
    expect(playConnectorReturnPath(null)).toBeNull();
    expect(playConnectorReturnPath('')).toBeNull();
    expect(playConnectorReturnPath('/app')).toBeNull();
    expect(playConnectorReturnPath('/app/dashboard')).toBeNull();
    expect(playConnectorReturnPath('/app/car-sharing/extra')).toBeNull();
    expect(playConnectorReturnPath('//evil.example')).toBeNull();
    expect(playConnectorReturnPath('https://evil.example')).toBeNull();
    expect(playConnectorReturnPath('/app/car-sharing?next=https://evil.example')).toBeNull();
  });
});
