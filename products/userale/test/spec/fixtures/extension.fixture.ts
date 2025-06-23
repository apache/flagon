import { test as base, chromium, type BrowserContext, type Page, type Request } from '@playwright/test';
import path from 'path';
import os from 'os';

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
  waitForPostRequest: (
    filterFn?: (req: Request) => boolean
  ) => Promise<Request>;
}>({
  context: async ({ }, use) => {
    const pathToExtension = path.join(
      __dirname,
      "../../../packages/flagon-userale-ext/build/chrome-mv3-prod/"
    );
    const context = await chromium.launchPersistentContext(os.tmpdir(), {
      channel: 'chromium',
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    await use(context);
    await context.close();
  },

  extensionId: async ({ context }, use) => {
    let [background] = context.serviceWorkers();
    if (!background)
      background = await context.waitForEvent('serviceworker');

    const extensionId = background.url().split('/')[2];
    await use(extensionId);
  },

  waitForPostRequest: async ({ context }, use) => {
    const waitForPostRequest = (filterFn?: (req: Request) => boolean) => {
      return new Promise<Request>((resolve) => {
        const listener = async (req: Request) => {
          const url = req.url();
          const method = req.method();
          // console.log(req);

          if (!url.startsWith('http://localhost:8000') || method !== 'POST') return;

          if (!filterFn || filterFn(req)) {
            context.off('request', listener); // cleanup
            resolve(req);
          }
        };

        context.on('request', listener);
      });
    };

    await use(waitForPostRequest);
  },
});

export const expect = test.expect;
