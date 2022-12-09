const Parser = require('rss-parser');
const Feed = require('feed').Feed;
const crypto = require('crypto');
const fs = require('fs/promises');
const process = require('process');

//const FeedUrl = 'https://lvv2.com/rss';
const FeedUrl = 'https://feeds.feedburner.com/lvv2-feed';

function nameToLowerCase(name){
  if (name === 'PUBDATE') return 'pubDate';
  return name.toLowerCase();
}

let parser = new Parser({
  timeout: 3000,
  headers: {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15'},
  maxRedirects: 10,
  defaultRSS: 2.0,
//  customFields: {
//    item: [
//      ['pubDate', 'pubDate', {keepArray: true}]
//    ],
//  },
  xml2js: {
    tagNameProcessors: [nameToLowerCase],
    attrNameProcessors: [nameToLowerCase],
    strict: false,
  },
});

const newFeed = new Feed({
  title: 'Lvv2 Feed',
  description: 'Lvv2.com 的非官方 Feed',
//  link: 'https://ruanyf.github.io/lvv2-feed/',
  link: 'https://lvv2-feed.vercel.app/',
  language: 'zh-CN',
  generator: 'Lvv2 feed generator',
  feedLinks: {
    json: 'https://lvv2-feed.vercel.app/rss.json',
    rss: 'https://lvv2-feed.vercel.app/rss.xml'
  },
});

(async () => {
  let feed;
  try {
    feed = await parser.parseURL(FeedUrl);
  } catch (err) {
    throw err;
  }

  let count = 0;

  feed.items.forEach((item) => {
    let link = item.link;

    if (!link) return;

    if (link.includes('xn--')) return;

    if (link.length <= 27) {
      return;
    } else if (!link.includes('instant.lvv2.com')) {
      link = 'http://' + item.link.substr(27);
    }

    const hostname = (new URL(link)).hostname;

    const urlFilterArr =[
      'www.bilibili.com/video/',
      'weibo.com',
      'm.weibo.cn',
    ];
    for (let n = 0; n < urlFilterArr.length; n++) {
      if (link.includes(urlFilterArr[n])) return;
    }

    const hostFilterArr = [
      'acfun.cn',
      'www.douban.com',
      'm.douban.com',
      'bilibili.com',
      'meipin.im',
      'video.weibo.com',
      'video.h5.weibo.cn',
      'weibointl.api.weibo.com',
      't.cn',
      'twitter.com',
      'wap.newsmth.net',
      'www.yystv.cn',
      'youtu.be',
    ];
    if (hostFilterArr.includes(hostname)) return;

    if (hostname === 'www.voachinese.com') {
      link = link.replace('htmlutm', 'html?utm');
    }

    count = count + 1;
    if (count >= 100) return;

    let d = new Date(item.pubDate);
    // 原始时间为中国时区，如果服务器为国际时区，需要调整
    if (new Date().getTimezoneOffset() !== -480) {
      d = new Date(d.getTime() + (d.getTimezoneOffset() - 480) * 60000);
    }

    newFeed.addItem({
      title: item.title,
      id: crypto.createHash('md5').update(item.link).digest('hex'),
      link,
      content: '',
      date: d,
    });
  });

  try {
    await fs.rm('./dist', { recursive: true, force: true });
    console.log(`successfully deleted ./dist`);
    await fs.mkdir('./dist');
    console.log(`successfully create ./dist`);
    await fs.writeFile('./dist/rss.json', newFeed.json1());
    console.log(`successfully write rss.json`);
    await fs.writeFile('./dist/rss.xml', newFeed.rss2());
    console.log(`successfully write rss.xml`);
    await fs.copyFile('./template/index.html', `./dist/index.html`);
    await fs.copyFile('./template/page.js', `./dist/page.js`);
    console.log(`successfully copy asset files`);
  } catch (err) {
    throw err;
  }

})().catch(err => {
  console.log(err);
  process.exit(1);
});
