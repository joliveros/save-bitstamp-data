import yargs from 'yargs';
import dwgQueue from 'bull';
import _ from 'lodash';
import Scraper from './lib/scraper';

const debug = require('debug')('scraper');

let queue;

const host = yargs.argv.host || 'localhost';

const scraper = new Scraper();

async function queueDwgs() {
  const results = scraper.getRefMatch('http://www.bibliocad.com/', '#collections li>a');

  const urls = _.filter(results, url => !/#/.test(url));

  const catUrls = _.map(urls, cat => `http://www.bibliocad.com${cat}`);

  queue = dwgQueue('dwg', 6379, host);

  catUrls.forEach((cat) => {
    const catId = cat.match(/(.+)\/[0-9]+$/)[1];

    scraper.getDwgUrls(catId, (dwgUrl) => {
      debug(dwgUrl);
      queue.add({ url: dwgUrl });
    });
  });
}


async function processDwg(job) {
  try {
    const data = await scraper.saveFromUrl(job.data.url);

    debug(data);
  } catch (e) {
    debug(e);
  }
}

function startQueue() {
  queue = dwgQueue('dwg', 6379, host);
  queue.process(processDwg);
  // q.resume()
}

if (yargs.argv.start) {
  queueDwgs();
} else {
  startQueue();
}
