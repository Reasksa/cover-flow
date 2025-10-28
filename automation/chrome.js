const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

/**
 * Creates a Chrome WebDriver instance with sensible defaults.
 * The user must have Chrome installed. Driver binaries are managed by selenium-webdriver automatically if compatible.
 */
async function createDriver() {
  const options = new chrome.Options()
    .addArguments(
      '--disable-notifications',
      '--disable-infobars',
      '--start-maximized'
    );

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  return driver;
}

const PlatformLoginUrls = {
  youtube: 'https://accounts.google.com/signin/v2/identifier',
  tiktok: 'https://www.tiktok.com/login',
  facebook: 'https://www.facebook.com/login',
  instagram: 'https://www.instagram.com/accounts/login/',
  twitter: 'https://twitter.com/i/flow/login',
  linkedin: 'https://www.linkedin.com/login'
};

/**
 * Opens the login page for the specified platform and waits until the user completes login manually.
 * This function assists the user by navigating to the login page. 2FA/CAPTCHA is user-assisted.
 */
async function login(platform) {
  const driver = await createDriver();
  try {
    const url = PlatformLoginUrls[platform] || 'https://www.google.com/';
    await driver.get(url);

    // Wait heuristically for login to complete: check URL domain change or presence of user profile element.
    // Because each platform differs, we use a generous timeout and instruct the user via the page itself.
    await driver.wait(async () => {
      const currentUrl = await driver.getCurrentUrl();
      // If not on a login URL anymore, consider it done
      return !currentUrl.includes('login') &&
             !currentUrl.includes('signin') &&
             !currentUrl.includes('identifier');
    }, 5 * 60 * 1000).catch(() => {}); // Don't throw on timeout; user may close manually

    return { success: true, message: `Login flow opened for ${platform}. Complete authentication in the browser window.` };
  } catch (err) {
    return { success: false, error: String(err) };
  } finally {
    // Keep driver open so user can finish auth; caller can close if needed.
  }
}

/**
 * Helpers
 */
async function tryUploadFile(driver, selectors, filePath) {
  for (const sel of selectors) {
    const elems = await driver.findElements(By.css(sel));
    if (elems.length) {
      const el = elems[0];
      try {
        await driver.executeScript('arguments[0].style.display="block"; arguments[0].removeAttribute("hidden");', el);
      } catch {}
      try {
        await el.sendKeys(filePath);
        return true;
      } catch {}
    }
  }
  return false;
}

async function trySetText(driver, selectors, text) {
  for (const sel of selectors) {
    const elems = await driver.findElements(By.css(sel));
    if (elems.length) {
      const el = elems[0];
      try {
        await driver.wait(until.elementIsVisible(el), 10000).catch(() => {});
        await el.click();
        await el.sendKeys(text);
        return true;
      } catch {}
    }
  }
  return false;
}

/**
 * Posts content based on job description.
 * Tries per-platform best-effort automations, otherwise opens posting page and lets user finish.
 */
async function post(job) {
  const driver = await createDriver();
  try {
    const { platform, files, caption, hashtags } = job;
    const hashtagStr = Array.isArray(hashtags) ? hashtags.join(' ') : '';
    const text = `${caption} ${hashtagStr}`.trim();

    let targetUrl = null;

    switch (platform) {
      case 'youtube':
        targetUrl = 'https://studio.youtube.com/channel/UC/videos/upload';
        break;
      case 'tiktok':
        targetUrl = 'https://www.tiktok.com/upload?lang=en';
        break;
      case 'facebook':
        targetUrl = 'https://www.facebook.com/';
        break;
      case 'instagram':
        targetUrl = 'https://www.instagram.com/';
        break;
      case 'twitter':
        targetUrl = 'https://twitter.com/compose/tweet';
        break;
      case 'linkedin':
        targetUrl = 'https://www.linkedin.com/feed/';
        break;
      default:
        targetUrl = 'https://www.google.com/';
    }

    await driver.get(targetUrl);

    // YouTube upload
    if (platform === 'youtube' && files && files.length) {
      try {
        await driver.wait(until.elementLocated(By.css('input[type="file"]')), 20000);
        await tryUploadFile(driver, ['input[type="file"]'], files[0]);
        await trySetText(driver, ['#textbox', 'textarea', 'input[aria-label="Title"]'], text);
      } catch {}
    }

    // TikTok upload
    if (platform === 'tiktok' && files && files.length) {
      try {
        // Wait for upload area
        await driver.wait(until.elementLocated(By.css('input[type="file"]')), 20000);
        await tryUploadFile(driver, ['input[type="file"]', 'input[accept*="video"]'], files[0]);
        await trySetText(driver, ['div[role="textbox"]', 'textarea'], text);
      } catch {}
    }

    // Facebook composer (home feed)
    if (platform === 'facebook') {
      try {
        await driver.get('https://www.facebook.com/');
        const composerSelectors = [
          'div[aria-label="Create a post"]',
          'div[aria-label="What\'s on your mind?"]',
          'div[role="textbox"]'
        ];
        await trySetText(driver, composerSelectors, text);
        if (files && files.length) {
          await tryUploadFile(driver, ['input[type="file"]', 'input[accept*="image"], input[accept*="video"]'], files[0]);
        }
      } catch {}
    }

    // Instagram (desktop web is limited; best-effort caption in profile/DM text areas)
    if (platform === 'instagram') {
      try {
        await driver.get('https://www.instagram.com/');
        await trySetText(driver, ['textarea', 'div[role="textbox"]'], text);
        // Upload requires mobile emulation / specific flows; defer to user
      } catch {}
    }

    // Twitter (X) compose
    if (platform === 'twitter') {
      try {
        await driver.get('https://twitter.com/compose/tweet');
        await trySetText(driver, ['div[role="textbox"]', 'textarea'], text);
        if (files && files.length) {
          await tryUploadFile(driver, ['input[type="file"]', 'input[accept*="image"], input[accept*="video"]'], files[0]);
        }
      } catch {}
    }

    // LinkedIn share
    if (platform === 'linkedin') {
      try {
        await driver.get('https://www.linkedin.com/feed/');
        const shareSelectors = [
          'div[role="textbox"]',
          'textarea'
        ];
        await trySetText(driver, shareSelectors, text);
        if (files && files.length) {
          await tryUploadFile(driver, ['input[type="file"]', 'input[accept*="image"], input[accept*="video"]'], files[0]);
        }
      } catch {}
    }

    // Generic guidance
    try {
      await driver.executeScript(`
        console.log('Reaksaio: If you are not logged in, please log in first.');
        console.log('Reaksaio: Then upload/select media and paste the prepared caption below:');
        console.log(${JSON.stringify(text)});
      `);
    } catch {}

    // Generic text injection fallback
    await trySetText(driver, ['textarea', 'div[role="textbox"]', 'input[type="text"]'], text);

    return { success: true, message: `Opened ${platform} posting page. ${files && files.length ? `Prepared ${files.length} file(s)` : 'No files selected'}.`, details: { files, text } };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

module.exports = {
  login,
  post
};