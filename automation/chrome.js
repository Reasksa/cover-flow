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
 * Posts content based on job description.
 * For MVP we open the platform creator/uploader page and leave the user to finalize and submit.
 * Later this can be expanded to fully automated DOM interactions per platform.
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

    // Simple guidance overlay via console logs in DevTools
    try {
      await driver.executeScript(`
        console.log('Reaksaio: If you are not logged in, please log in first.');
        console.log('Reaksaio: Then upload/select media and paste the prepared caption below:');
        console.log(${JSON.stringify(text)});
      `);
    } catch {}

    // Try to find a text area and paste the text (best-effort, varies per platform)
    const possibleSelectors = [
      'textarea',
      'div[role="textbox"]',
      'input[type="text"]'
    ];

    for (const sel of possibleSelectors) {
      const elements = await driver.findElements(By.css(sel));
      if (elements.length) {
        const el = elements[0];
        await driver.wait(until.elementIsVisible(el), 10000).catch(() => {});
        try {
          await el.click();
          await el.sendKeys(text);
          break;
        } catch {}
      }
    }

    // We cannot reliably automate uploads universally without per-platform logic.
    // The user can drag-drop files into the platform upload UI.
    return { success: true, message: `Opened ${platform} posting page. Please upload your media (${files.length} file(s)) and submit.`, details: { files, text } };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

module.exports = {
  login,
  post
};