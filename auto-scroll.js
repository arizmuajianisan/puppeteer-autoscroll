const puppeteer = require('puppeteer');
require('dotenv').config(); // Load environment variables from .env

(async () => {
    // Launch browser and get screen dimensions
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--start-maximized'] // Start browser maximized
    });

    const page = await browser.newPage();

    // Set the viewport to the maximum size of the browser window
    await page.setViewport({ width: 0, height: 0 }); // Temporary, will resize later

    // Navigate to any URL to initialize window object
    await page.goto('about:blank');

    // Get the dimensions of the viewport
    const dimensions = await page.evaluate(() => {
        return {
            width: window.screen.availWidth,
            height: window.screen.availHeight
        };
    });

    // Set the viewport to the retrieved dimensions
    await page.setViewport(dimensions);

    const url = 'http://192.168.148.14:8888';
    const loginURL = `${url}/login`; // Update this if your login URL is different
    const username = process.env.USERNAME; // Load username from .env
    const password = process.env.PASSWORD; // Load password from .env

    await page.goto(url);

    // Check if already logged in
    if (await isLoggedIn(page)) {
        console.log('Already logged in');
    } else {
        console.log('Not logged in, performing login');
        await performLogin(page, loginURL, username, password);
    }

    // Perform infinite auto-scroll
    await autoScroll(page);

    // Note: This script will keep the browser open indefinitely.
    // If you want to close the browser after a certain time, you can add a timeout.
    // For example, to close after 1 hour (3600000 milliseconds):
    // setTimeout(async () => await browser.close(), 3600000);
})();

async function isLoggedIn(page) {
    try {
        // Check for an element that only exists when logged in
        await page.waitForSelector('.logout-button', { timeout: 3000 });
        return true;
    } catch (error) {
        return false;
    }
}

async function performLogin(page, loginURL, username, password) {
    await page.goto(loginURL);

    // Ensure the email field exists and clear it
    const emailSelector = 'input[name="email"]';
    await page.waitForSelector(emailSelector);
    await page.evaluate((emailSelector) => {
        document.querySelector(emailSelector).value = '';
    }, emailSelector);
    await page.type(emailSelector, username);

    // Ensure the password field exists and clear it
    const passwordSelector = 'input[name="password"]';
    await page.waitForSelector(passwordSelector);
    await page.evaluate((passwordSelector) => {
        document.querySelector(passwordSelector).value = '';
    }, passwordSelector);
    await page.type(passwordSelector, password);

    const loginButtonSelector = 'button[type="button"]'; // Replace with the actual selector for the login button
    await page.waitForSelector(loginButtonSelector);
    await page.click(loginButtonSelector);
    await page.waitForNavigation(); // Wait for navigation after login
}

async function autoScroll(page) {
    await page.evaluate(async () => {
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        async function scroll(direction) {
            let distance = 100;
            let reachedEnd = false;

            while (!reachedEnd) {
                let prevScrollHeight = document.documentElement.scrollHeight;
                if (direction === 'down') {
                    window.scrollBy(0, distance);
                    await sleep(500); // 0.5-second delay
                    let newScrollHeight = document.documentElement.scrollHeight;
                    reachedEnd = (window.innerHeight + window.scrollY) >= newScrollHeight;
                } else {
                    window.scrollBy(0, -distance);
                    await sleep(500); // 0.5-second delay
                    reachedEnd = window.scrollY === 0;
                }
            }
        }

        while (true) {
            await scroll('down');
            await scroll('up');
        }
    });
}
