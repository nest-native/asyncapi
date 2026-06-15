import { Type } from '@nestjs/common';
import { MetadataScanner, ModulesContainer } from '@nestjs/core';

/**
 * A single class discovered while walking NestJS metadata, paired with the
 * method names that are candidate message handlers.
 *
 * The generator reads the `@AsyncApiChannel` / `@AsyncApiPub` / `@AsyncApiSub`
 * decorator metadata off these classes and methods to populate channels and
 * operations, reaching every handler the same way `@nestjs/swagger` reaches
 * every `@Controller`.
 */
export interface ScannedHandler {
  /** The class (metatype) of the discovered provider or controller. */
  metatype: Type;
  /** The names of the prototype methods that are candidate handlers. */
  methodNames: string[];
}

/**
 * Walks NestJS metadata to discover the classes that may carry AsyncAPI
 * decorators.
 *
 * The walk mirrors how `@nestjs/swagger` discovers controllers: it reads the
 * `ModulesContainer` populated by Nest at bootstrap and visits every provider
 * and controller in every module, then enumerates each instance's prototype
 * methods with the {@link MetadataScanner}. The discovery is decorator-driven
 * downstream, so this same walk powers the whole generator unchanged.
 */
export class AsyncApiDocumentScanner {
  constructor(
    private readonly modulesContainer: ModulesContainer,
    private readonly metadataScanner: MetadataScanner,
  ) {}

  /**
   * Visit every module, provider, and controller and return the handler
   * candidates found.
   */
  scan(): ScannedHandler[] {
    const handlers: ScannedHandler[] = [];

    for (const module of this.modulesContainer.values()) {
      for (const wrapper of module.providers.values()) {
        this.collectHandler(handlers, wrapper);
      }
      for (const wrapper of module.controllers.values()) {
        this.collectHandler(handlers, wrapper);
      }
    }

    return handlers;
  }

  private collectHandler(
    handlers: ScannedHandler[],
    wrapper: { instance?: unknown; metatype?: Type | Function | null },
  ): void {
    const { instance, metatype } = wrapper;

    if (!instance || typeof instance !== 'object' || !metatype) {
      return;
    }

    const prototype = Object.getPrototypeOf(instance) as object | null;
    const methodNames = this.metadataScanner.getAllMethodNames(prototype);

    handlers.push({ metatype: metatype as Type, methodNames });
  }
}
