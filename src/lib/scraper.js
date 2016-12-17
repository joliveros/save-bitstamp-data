import _ from 'lodash';
import cheerio from 'cheerio';
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

const COOKIE = JSON.parse(fs.readFileSync('./config.json', 'utf8')).cookie;
const debug = require('debug')('scraper');


const BASEURL = 'http://www.bibliocad.com/';

export default function () {
  async function getCategoryUrls() {
    const request = await fetch(BASEURL);
    const body = await request.text();

    const $ = cheerio.load(body);

    const categoryUrls = _.map($('li>a'), a => $(a).attr('href'));

    debug(categoryUrls);
    return categoryUrls;
  }

  async function getRefMatch(url, match) {
    const result = await fetch(url);
    const body = await result.text();

    const $ = cheerio.load(body);

    const results = _.map($(match), a => $(a).attr('href'));

    debug(results);
    return results;
  }

  async function getMaxPageForCategory(catUrl) {
    const urls = await getRefMatch(catUrl, '.pagination a');

    const pages = _.map(urls, url => parseInt(url.match(/[0-9]*$/)[0]), 10); // eslint-disable-line

    debug(pages);
    return _.max(pages);
  }

  async function dwgUrlsFromPage(pageUrl) {
    const urls = await this.getRefMatch(pageUrl, '.thumb-title');

    debug(urls);
    return urls;
  }

  async function getDwgData(dwgUrl) {
    const [url, filename, id] = dwgUrl.match(/([^/]+)_([0-9]+)$/); // eslint-disable-line
    const data = { filename, id };

    debug(data);

    const request = await fetch(`http://www.bibliocad.com${dwgUrl}`);
    const body = await request.text();

    const $ = cheerio.load(body);

    // get tags
    data.tags = _.map($('.tags li span'), t => $(t).html());

    const $img = $('#imgprevdef');
    // get img
    data.img = $img.attr('src');

    // get title
    const title = $img.attr('alt').match(/^(.*)\(/)[1];

    if (title.length > 3) {
      data.title = title;
    } else {
      data.title = $img.attr('alt');
    }

    return data;
  }

  const now = () => (new Date()).getTime();

  async function getDownloadUrl(dwgData) {
    const { id, filename } = dwgData;
    const data = {
      file_extension: 'zip',
      file_id: id,
      file_title: filename,
      file_type: 'file',
      time: now(),
    };

    const form = new FormData();

    _.toPairs(data).forEach((keyValue) => {
      form.append(...keyValue);
    });

    const request = await fetch('http://www.bibliocad.com/xhr/files-url', {
      method: 'POST',
      headers: {
        Cookie: COOKIE,
      },
      body: form,
    });

    const body = await request.json();

    debug(body.db);
    return body.db;
  }

  async function getDwgUrls(url) {
    const ctx = this;
    let max = await this.getMaxPageForCategory(url);
    let urls;

    while (max > 0) {
      const reqs = [];

      for (let i = 0; i < 5; i++) {
        debug(`${url}/${max}`);
        reqs.push(ctx.dwgUrlsFromPage(`${url}/${max}`));
        max -= 1;
      }

      const res = await Promise.all(reqs);

      urls = _.reduce(res, (all, urlsFromPage) => all.concat(urlsFromPage), []);
    }

    debug(urls);
    return urls;
  }

  async function save(dwg) { // eslint-disable-line
    // const { ext } = dwg;
    // const file = new File(_.omit(dwg, ['file_id', 'file_title']));
    // file.set('filename', `${file._id}.${ext}`)
    // const get = agent.get(file.downloadUrl)
    // await storage.putStreamBuffer(get, file.filename, {'Content-Type':'application/zip'})
    // const img = agent.get(file.img)
    // file.set('img', `${file._id}.jpg`)
    // await imgStorage.putStreamBuffer(img, file.img, {'Content-Type':'image/jpeg'})
    // const _file = await file.save();
    // return file
  }

  async function saveFromUrl(url) {
    const dwg = await this.getDwgData(url);
    return await save(dwg);
  }

  return {
    dwgUrlsFromPage,
    getCategoryUrls,
    getDownloadUrl,
    getDwgData,
    getDwgUrls,
    getMaxPageForCategory,
    getRefMatch,
    saveFromUrl,
  };
}
