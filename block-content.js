const BLOCKED = [
  // Social media
  'facebook.com',
  'instagram.com',
  'tiktok.com',
  'snapchat.com',
  'twitter.com',
  'x.com',
  'reddit.com',
  'tumblr.com',
  'pinterest.com',
  'linkedin.com',
  'discord.com',
  'threads.net',
  'bereal.com',
  'bsky.app',
  'bluesky.social',
  'mewe.com',
  'mastodon.social',
  'telegram.org',

  // Video & streaming
  'youtube.com',
  'twitch.tv',
  'netflix.com',
  'hulu.com',
  'disneyplus.com',
  'max.com',
  'hbomax.com',
  'primevideo.com',
  'peacocktv.com',
  'paramountplus.com',
  'crunchyroll.com',
  'funimation.com',
  'dailymotion.com',
  'rumble.com',
  'kick.com',

  // Gaming
  'steam.com',
  'steampowered.com',
  'roblox.com',
  'epicgames.com',
  'miniclip.com',
  'kongregate.com',
  'newgrounds.com',
  'poki.com',
  'crazygames.com',
  'coolmathgames.com',
  'armorgames.com',
  'y8.com',
  'friv.com',
  'addictinggames.com',

  // Junk & time-wasters
  '9gag.com',
  'imgur.com',
  'buzzfeed.com',
  'boredpanda.com',
  'ifunny.co',
  'knowyourmeme.com',
  'funnyjunk.com',
  'thechive.com',
  'cheezburger.com',
  'ebaumsworld.com',
];

const host = location.hostname.replace(/^www\./, '');

if (BLOCKED.some(domain => host === domain || host.endsWith('.' + domain))) {
  window.stop();
  window.location.replace(chrome.runtime.getURL('blocked.html'));
}
