const Parser = require('rss-parser');
const Feed = require('feed').Feed;
const crypto = require('crypto');
const fs = require('fs/promises');
const process = require('process');

const FeedUrl = 'https://lvv2.com/rss';

let parser = new Parser({
  timeout: 3000,
  headers: {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.10130'},
  maxRedirects: 5,
});

const newFeed = new Feed({
  title: 'Lvv2 Feed',
  description: 'Lvv2.com 的非官方 Feed',
  link: 'https://ruanyf.github.io/lvv2-feed/',
  language: 'zh-CN',
  generator: 'Lvv2 feed generator',
  feedLinks: {
    json: 'https://ruanyf.github.io/lvv2-feed/rss.json',
    rss: 'https://ruanyf.github.io/lvv2-feed/rss.xml'
  },
});

(async () => {
  let feed;
  try {
    feed = await parser.parseURL(FeedUrl);
  } catch (err) {
    throw err;
  }


  feed.items.forEach((item) => {
    let link = item.link;

    if (!link) return;

    if (link.length <= 27) {
      // no operation;
    } else if (!link.includes('instant.lvv2.com')) {
      link = 'http://' + item.link.substr(27);
    }

    const hostname = (new URL(link)).hostname;

    const urlFilterArr =[
      'www.bilibili.com/video/',
      'weibo.com/tv/',
    ];
    for (let n = 0; n < urlFilterArr.length; n++) {
      if (link.includes(urlFilterArr[n])) return;
    }

    const hostFilterArr = [
      'meipin.im',
      'video.weibo.com',
      'video.h5.weibo.cn',
      'weibointl.api.weibo.com',
      't.cn',
      'twitter.com',
      'wap.newsmth.net',
      'www.yystv.cn',
    ];
    if (hostFilterArr.includes(hostname)) return;

    link = link.replace('contentid', 'content?id');

    newFeed.addItem({
      title: item.title,
      id: crypto.createHash('md5').update(item.link).digest('hex'),
      link,
      content: '',
      date: new Date(item.pubDate),
    });
  });

  try {
    await fs.rmdir('./dist', { recursive: true});
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
