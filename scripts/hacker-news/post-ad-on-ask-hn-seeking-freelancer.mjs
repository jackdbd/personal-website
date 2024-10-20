import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import defDebug from "debug";
import { chromium } from "playwright";
import {
  defRenderTelegramErrorMessage,
  EMOJI,
  jsonSecret,
  sendOutput,
  waitMs,
} from "../utils.mjs";
import { latestItemByUsername } from "./utils.mjs";

const debug = defDebug("hn:post-ad");

const __filename = fileURLToPath(import.meta.url);
const splits = __filename.split("/");
const app_id = splits[splits.length - 1];
const app_version = "0.1.0";

const renderTelegramErrorMessage = defRenderTelegramErrorMessage({
  header: `<b>${EMOJI.Robot} ASK HN: Freelancer? Seeking Freelancer?</b>`,
  footer: `<i>Sent by ${app_id} (vers. ${app_version})</i>`,
});

const renderTelegramSuccessMessage = (d) => {
  let s = `<b>${EMOJI.Robot} ASK HN: Freelancer? Seeking Freelancer?</b>`;

  s = s.concat("\n\n");
  s = s.concat(
    `This ad was posted on <a href="${d.hn_url}">Hacker News item ${d.hn_item_id}</a>`,
  );
  s = s.concat("\n");
  s = s.concat(`<pre>${d.ad}</pre>`);

  s = s.concat("\n\n");
  s = s.concat(`<i>Sent by ${app_id}</i>`);

  // we need to add a newline character, otherwise the GitHub workflow will fail
  // with this error: "Matching delimiter not found"
  return s.concat("\n");
};

const postAdOnHackerNews = async ({ browser, hn_item_id }) => {
  debug(`will try posting ad on Hacker News item ID ${hn_item_id}`);
  let ad = "";
  if (process.env.GITHUB_SHA) {
    if (!process.env.HN_AD) {
      throw new Error(`environment variable HN_AD not set`);
    }
    debug(`read ad from environment variable HN_AD`);
    ad = process.env.HN_AD;
  } else {
    const filepath = path.join("assets", "ads", "ask-hn-freelancer.txt");
    debug(`read ad from file ${filepath}`);
    ad = fs.readFileSync(filepath).toString();
  }

  const { username, password } = jsonSecret({
    name: "HACKER_NEWS",
    filepath: "/run/secrets/hacker-news/credentials",
  });

  // throw new Error(`Aborted: post ad on Hacker News`)

  debug(`launch Playwright`);
  const page = await browser.newPage();
  const hn_url = `https://news.ycombinator.com/item?id=${hn_item_id}`;
  debug(`go to ${hn_url}`);
  await page.goto(hn_url);

  debug(`navigate to login page`);
  await page.locator(`a[href="login?goto=item%3Fid%3D${hn_item_id}"]`).click();

  debug(`submit login credentials`);
  await page.locator('input[type="text"]').first().fill(username);
  await page.locator('input[type="password"]').first().fill(password);
  // This selector is fine, but somehow HN flags this script as a "Bad Login".
  await page.locator('input[type="submit"]').first().click();
  // I tried to add a waiting time (up to 15s) but it seems not to work.

  debug(`write ad in the textarea`);
  await page.locator("textarea").fill(ad);
  // we can't immediately post the ad. HN would understand this is an automated
  // submission. Explicitly waiting for a few seconds seems to bypass the HN
  // detection algorithm.
  const ms = 5000;
  debug(`wait ${ms}ms to try bypassing the HN detection algorithm`);
  await waitMs(5000);

  debug(`submit`);
  // Hacker News seems to update the page, so this selector changes quite often.
  const locator = page.locator('input[type="submit"]');
  // const locator = page.getByText('add comment')
  await locator.click();

  const loc = page.getByText("Sorry, but you've already posted here").first();
  const text_content = await loc.textContent({ timeout: 5000 });
  if (text_content) {
    throw new Error(`You have already posted this ad to ${hn_url}`);
  }

  // Initially I had thought of using waitForFunction, which executes JS in the
  // browser. But this can't be done because Hacker News has a
  // Content-Security-Policy that prevents JS execution.
  // https://playwright.dev/docs/api/class-page#page-wait-for-function
  // await page.getByText('add comment').click()

  return { ad, hn_url, hn_item_id };
};

/**
 * Script to post my ad on ASK HN: Freelancer? Seeking Freelancer?
 *
 * This script is meant to be used in a GitHub workflow, but can also be run locally.
 *
 * Usage:
 * node scripts/hacker-news/post-ad-on-ask-hn-seeking-freelancer.mjs
 * node scripts/hacker-news/post-ad-on-ask-hn-seeking-freelancer.mjs <hn_item_id>
 *
 * Example:
 * post ad in this month's Ask HN story
 * node scripts/hacker-news/post-ad-on-ask-hn-seeking-freelancer.mjs
 * post ad in the Ask HN story of March 2023
 * node scripts/hacker-news/post-ad-on-ask-hn-seeking-freelancer.mjs 34983766
 *
 * See also:
 * https://news.ycombinator.com/submitted?id=whoishiring
 */

const main = async () => {
  const args = process.argv.slice(2);

  let text = `<b>${EMOJI.Robot} ASK HN: Freelancer? Seeking Freelancer?</b>`;
  text = text.concat("\n\n");
  text = text.concat("If you see this, something went wrong and must be fixed");
  text = text.concat("\n\n");
  text = text.concat(`<i>Sent by ${app_id}</i>`);

  // https://giacomodebidda.com/posts/playwright-on-nixos/
  // When running on:
  // - GitHub Actions => use the chromium revision bundled with Playwright.
  // - my NixOS laptop => use the chromium revision installed with Home Manager.
  const browser = await chromium.launch({
    executablePath: process.env.GITHUB_SHA
      ? undefined
      : process.env.CHROMIUM_PATH,
    headless: process.env.GITHUB_SHA ? true : false,
  });

  let hn_item_id = undefined;
  if (args.length === 0) {
    const item = await latestItemByUsername();
    hn_item_id = item.id;
  } else if (args.length === 1) {
    hn_item_id = args[0];
  } else {
    throw new Error(
      [
        `INCORRECT NUMBER OF ARGUMENTS\n`,
        `USAGE:`,
        `node post-ad-on-ask-hn-seeking-freelancer.mjs OR node post-ad-on-ask-hn-seeking-freelancer.mjs <hn_item_id>`,
      ].join("\n"),
    );
  }

  try {
    const d = await postAdOnHackerNews({ browser, hn_item_id });
    text = renderTelegramSuccessMessage(d);
  } catch (err) {
    text = renderTelegramErrorMessage(err);
  } finally {
    await browser.close();
    await sendOutput(text);
  }
};

main();
