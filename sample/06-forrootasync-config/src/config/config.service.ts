import { Injectable } from '@nestjs/common';

/**
 * A small configuration service standing in for whatever async source a real
 * application reads from — environment variables, a secrets manager, or a
 * remote config server. The values here seed the generated AsyncAPI document's
 * `info` block through `AsyncApiModule.forRootAsync`.
 */
@Injectable()
export class ConfigService {
  private readonly settings: Record<string, string> = {
    SERVICE_TITLE: 'Notifications Service',
    SERVICE_VERSION: '2.1.0',
  };

  /**
   * Resolve a configuration value asynchronously, as a real provider backed by
   * I/O would. Throws when the key is absent so misconfiguration fails loudly.
   */
  async resolve(key: string): Promise<string> {
    const value = this.settings[key];

    if (value === undefined) {
      throw new Error(`Missing configuration value for "${key}".`);
    }

    return Promise.resolve(value);
  }
}
