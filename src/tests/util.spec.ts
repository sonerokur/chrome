import * as utils from '../utils';
import { IncomingMessage } from 'http';

const getArgs = (overrides = {}) => ({
  args: [],
  blockAds: false,
  headless: true,
  ignoreDefaultArgs: false,
  ignoreHTTPSErrors: false,
  pauseOnConnect: false,
  slowMo: undefined,
  userDataDir: undefined,
  ...overrides,
});

describe(`Utils`, () => {
  // These only matter insomuch as that they can change launch flags
  describe('#canPreboot', () => {
    describe('args', () => {
      it('returns true when undefined', () => {
        expect(utils.canPreboot(getArgs({ args: undefined }), getArgs())).toBe(true);
      });

      it('returns true when it matches', () => {
        expect(utils.canPreboot(getArgs({ args: [] }), getArgs())).toBe(true);
      });

      it('returns true when args are the same', () => {
        expect(
          utils.canPreboot(
            getArgs({ args: ['--headless', '--window-size=1920,1080'] }),
            getArgs({ args: ['--window-size=1920,1080', '--headless'] })
          )
        ).toBe(true);
      });

      it('returns false when it does not match', () => {
        expect(
          utils.canPreboot(
            getArgs({ args: ['--headless', '--user-data-dir=/my-data'] }),
            getArgs({ args: ['--window-size=1920,1080', '--headless'] })
          )
        ).toBe(false);
      });
    });

    describe('headless', () => {
      it('returns true when undefined', () => {
        expect(utils.canPreboot(getArgs({ headless: undefined }), getArgs())).toBe(true);
      });

      it('returns true when it matches', () => {
        expect(utils.canPreboot(getArgs({ headless: true }), getArgs())).toBe(true);
      });

      it('returns false when it does not match', () => {
        expect(utils.canPreboot(getArgs({ headless: false }), getArgs())).toBe(false);
      });
    });

    describe('userDataDir', () => {
      it('returns true when undefined', () => {
        expect(utils.canPreboot(getArgs({ userDataDir: undefined }), getArgs())).toBe(true);
      });

      it('returns true when it matches', () => {
        expect(utils.canPreboot(getArgs({ userDataDir: 'my-cache' }), getArgs({ userDataDir: 'my-cache' }))).toBe(true);
      });

      it('returns false when it does not match', () => {
        expect(utils.canPreboot(getArgs({ userDataDir: 'my-cache' }), getArgs())).toBe(false);
      });
    });

    describe('ignoreDefaultArgs', () => {
      it('returns true when undefined', () => {
        expect(utils.canPreboot(getArgs({ ignoreDefaultArgs: undefined }), getArgs())).toBe(true);
      });

      it('returns true when it matches', () => {
        expect(utils.canPreboot(getArgs({ ignoreDefaultArgs: false }), getArgs())).toBe(true);
      });

      it('returns true when they are the same', () => {
        expect(
          utils.canPreboot(
            getArgs({ ignoreDefaultArgs: ['--headless'] }),
            getArgs({ ignoreDefaultArgs: ['--headless'] })
          )
        ).toBe(true);
      });

      it('returns true when they contain the same list', () => {
        expect(
          utils.canPreboot(
            getArgs({ ignoreDefaultArgs: ['--headless', '--user-data-dir=cache-money'] }),
            getArgs({ ignoreDefaultArgs: ['--user-data-dir=cache-money', '--headless'] })
          )
        ).toBe(true);
      });

      it('returns false when it does not match', () => {
        expect(
          utils.canPreboot(
            getArgs({ ignoreDefaultArgs: ['--headless'] }),
            getArgs({ ignoreDefaultArgs: ['--user-data-dir=cache-money'] })
          )
        ).toBe(false);
      });
    });
  });

  describe(`#getBasicAuthToken`, () => {
    it('returns the un-encoded token', () => {
      const token = 'abc';
      const authorization = `Basic ${Buffer.from(token).toString('base64')}`;

      const req = {
        headers: {
          authorization,
        },
      };

      expect(utils.getBasicAuthToken(req as any)).toEqual(token);
    });

    it('handles `username:password` formats', () => {
      const token = 'abc:';
      const authorization = `Basic ${Buffer.from(token).toString('base64')}`;

      const req = {
        headers: {
          authorization,
        },
      };

      expect(utils.getBasicAuthToken(req as any)).toEqual('abc');
    });

    it('handles spaces', () => {
      const token = 'abc';
      const authorization = `Bearer ${Buffer.from(token).toString('base64')}`;

      const req = {
        headers: {
          authorization,
        },
      };

      expect(utils.getBasicAuthToken(req as any)).toEqual('abc');
    });

    it('handles bare tokens', () => {
      const token = 'abc';
      const authorization = Buffer.from(token).toString('base64');

      const req = {
        headers: {
          authorization,
        },
      };

      expect(utils.getBasicAuthToken(req as any)).toEqual('abc');
    });

    it('returns empty if nothing is there', () => {
      const req = {
        headers: {
        },
      };

      expect(utils.getBasicAuthToken(req as any)).toEqual('');
    });
  });

  describe('#getTimeoutParam', () => {
    describe('for query-parameters', () => {
      it('returns undefined for -1', () => {
        const req = {
          parsed: {
            query: {
              timeout: '-1',
            },
          },
        };

        expect(utils.getTimeoutParam(req as any)).toEqual(undefined);
      });

      it('returns the timer in ms for numbers', () => {
        const req = {
          parsed: {
            query: {
              timeout: '2000',
            },
          },
        };

        expect(utils.getTimeoutParam(req as any)).toEqual(2000);
      });

      it('returns null for non-numbers', () => {
        const req = {
          parsed: {
            query: {
              timeout: 'wat',
            },
          },
        };

        expect(utils.getTimeoutParam(req as any)).toEqual(null);
      });

      it('returns null missing params', () => {
        const req = {
          parsed: {
            query: {},
          },
        };

        expect(utils.getTimeoutParam(req as any)).toEqual(null);
      });

      it('returns null if multiple are specified', () => {
        const req = {
          parsed: {
            query: {
              timeout: [100, 200],
            },
          },
        };

        expect(utils.getTimeoutParam(req as any)).toEqual(null);
      });
    });

    describe('for webdriver bodies', () => {
      it('returns undefined for -1', () => {
        const req = {
          body: {
            desiredCapabilities: {
              'browserless.timeout': -1,
            },
          },
          method: 'POST',
          url: '/webdriver',
        };

        expect(utils.getTimeoutParam(req as any)).toEqual(undefined);
      });

      it('returns the timer in ms for numbers', () => {
        const req = {
          body: {
            desiredCapabilities: {
              'browserless.timeout': 1000,
            },
          },
          method: 'POST',
          url: '/webdriver',
        };

        expect(utils.getTimeoutParam(req as any)).toEqual(1000);
      });

      it('returns null for non-numbers', () => {
        const req = {
          body: {
            desiredCapabilities: {
              'browserless.timeout': 'wat',
            },
          },
          method: 'POST',
          url: '/webdriver',
        };

        expect(utils.getTimeoutParam(req as any)).toEqual(null);
      });

      it('returns null missing params', () => {
        const req = {
          body: {
            desiredCapabilities: {},
          },
          method: 'POST',
          url: '/webdriver',
        };

        expect(utils.getTimeoutParam(req as any)).toEqual(null);
      });

      it('returns null if multiple are specified', () => {
        const req = {
          body: {
            desiredCapabilities: {
              'browserless.timeout': [123, 456],
            },
          },
          method: 'POST',
          url: '/webdriver',
        };

        expect(utils.getTimeoutParam(req as any)).toEqual(null);
      });
    });
  });

  describe('#isWebDriver', () => {
    it('matches webdriver requests', () => {
      expect(utils.isWebdriver({
        method: 'post',
        url: '/webdriver/session/3844eb32f13d2335724b5e3cdb4fa10a',
      } as IncomingMessage)).toBe(true);
    });

    it('matches GET webdriver requests', () => {
      expect(utils.isWebdriver({
        method: 'get',
        url: '/webdriver/session/3844eb32f13d2335724b5e3cdb4fa10a',
      } as IncomingMessage)).toBe(true);
    });

    it('matches DELETE webdriver requests', () => {
      expect(utils.isWebdriver({
        method: 'delete',
        url: '/webdriver/session/3844eb32f13d2335724b5e3cdb4fa10a',
      } as IncomingMessage)).toBe(true);
    });

    it('matches PUT webdriver requests', () => {
      expect(utils.isWebdriver({
        method: 'put',
        url: '/webdriver/session/3844eb32f13d2335724b5e3cdb4fa10a',
      } as IncomingMessage)).toBe(true);
    });

    it('does NOT match puppeteer calls', () => {
      expect(utils.isWebdriver({
        method: 'get',
        url: '/',
      } as IncomingMessage)).toBe(false);
    });

    it('does NOT match puppeteer calls', () => {
      expect(utils.isWebdriver({
        method: 'get',
        url: '/',
      } as IncomingMessage)).toBe(false);
    });

    it('does NOT match API calls', () => {
      expect(utils.isWebdriver({
        method: 'post',
        url: '/function',
      } as IncomingMessage)).toBe(false);
    });
  });

  describe('#isWebDriverStart', () => {
    it('matches webdriver start calls', () => {
      expect(utils.isWebdriverStart({
        method: 'post',
        url: '/webdriver/session',
      } as IncomingMessage)).toBe(true);
    });

    it('does not match existing webdriver calls', () => {
      expect(utils.isWebdriverStart({
        method: 'get',
        url: '/webdriver/session/3844eb32f13d2335724b5e3cdb4fa10a',
      } as IncomingMessage)).toBe(false);
    });

    it('does not matches DELETE webdriver requests', () => {
      expect(utils.isWebdriverStart({
        method: 'delete',
        url: '/webdriver/session/3844eb32f13d2335724b5e3cdb4fa10a',
      } as IncomingMessage)).toBe(false);
    });

    it('does not matches PUT webdriver requests', () => {
      expect(utils.isWebdriverStart({
        method: 'PUT',
        url: '/webdriver/session/3844eb32f13d2335724b5e3cdb4fa10a',
      } as IncomingMessage)).toBe(false);
    });

    it('does NOT match puppeteer calls', () => {
      expect(utils.isWebdriverStart({
        method: 'get',
        url: '/',
      } as IncomingMessage)).toBe(false);
    });

    it('does NOT match puppeteer calls', () => {
      expect(utils.isWebdriverStart({
        method: 'get',
        url: '/',
      } as IncomingMessage)).toBe(false);
    });

    it('does NOT match API calls', () => {
      expect(utils.isWebdriverStart({
        method: 'post',
        url: '/function',
      } as IncomingMessage)).toBe(false);
    });
  });

  describe('#isWebdriverClose', () => {
    it('matches session close calls', () => {
      expect(utils.isWebdriverClose({
        method: 'delete',
        url: '/webdriver/session/3844eb32f13d2335724b5e3cdb4fa10a',
      } as IncomingMessage)).toBe(true);
    });

    it('matches window close calls', () => {
      expect(utils.isWebdriverClose({
        method: 'delete',
        url: '/webdriver/session/3844eb32f13d2335724b5e3cdb4fa10a/window',
      } as IncomingMessage)).toBe(true);
    });

    [
      '/webdriver/session/3844eb32f13d2335724b5e3cdb4fa10a/cookie',
      '/webdriver/session/3844eb32f13d2335724b5e3cdb4fa10a/cookie/window',
      '/webdriver/session/3844eb32f13d2335724b5e3cdb4fa10a/local_storage',
      '/webdriver/session/3844eb32f13d2335724b5e3cdb4fa10a/local_storage/key/window',
      '/webdriver/session/3844eb32f13d2335724b5e3cdb4fa10a/session_storage',
      '/webdriver/session/3844eb32f13d2335724b5e3cdb4fa10a/session_storage/key/',
    ].forEach((url) => {

      it(`does NOT match "${url}" URL`, () => {
        expect(utils.isWebdriverClose({
          method: 'delete',
          url,
        } as IncomingMessage)).toBe(false);
      });
    });
  });
});
