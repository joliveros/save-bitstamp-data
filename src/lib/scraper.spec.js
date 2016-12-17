import { expect } from 'chai';
import _ from 'lodash';
import ms from 'ms';
import vcr from 'nock-vcr-recorder-mocha';
import nock from 'nock';
import Scraper from './scraper';

// vcr.config({mode: 'all'});


const debug = require('debug')('scraper:test');

const scraper = new Scraper();

describe('Scraper', function () {
  this.timeout(ms('10s'));

  context('#getCategoryUrls', () => {
    vcr.it('gets list of category urls', async function () {
      const categoryUrls = await scraper.getCategoryUrls();

      expect(categoryUrls).to.be.instanceof(Array);
      expect(categoryUrls[0]).to.match(/\/{1,3}/);
    });
  });

  context('#getRefMatch', () => {
    vcr.it('get hrefs at url', async function () {
      const result = await scraper.getRefMatch('http://www.bibliocad.com/', 'li>a');
      expect(result).to.be.instanceof(Array);
      expect(result[0]).to.match(/\/{1,3}/);
    });

    vcr.it('gets pagination urls', async function () {
      const path = 'library/mech--elect--plumb';
      const url = `http://www.bibliocad.com/${path}`;

      const pageUrls = await scraper.getRefMatch(url, '.pagination a');

      debug(pageUrls);
      expect(pageUrls[2].indexOf(path) > -1);
    });
  });

  context('#getMaxPageForCategory', () => {
    vcr.it('gets max page number', async function () {
      const url = 'http://www.bibliocad.com/library/mech--elect--plumb';
      const maxPageNumber = await scraper.getMaxPageForCategory(url);

      debug(maxPageNumber);
      expect(maxPageNumber).to.equal(167);
    });
  });

  context('#dwgUrlsFromPage', () => {
    vcr.it('gets each page', async function () {
      const pageUrl = 'http://www.bibliocad.com/library/mech--elect--plumb/1';
      const urls = await scraper.dwgUrlsFromPage(pageUrl);

      urls.forEach(url => expect(url).to.match(/_[0-9]{6}$/));
    });
  });

  function filesUrlRequest() {
    nock('http://www.bibliocad.com')
      .post(/files-url/g, /.*/)
      .reply(200, {
        db: 'http://dl01.bibliocad.com/download/14819564201612170634/104696v2328785_somefile.zip',
      });
  }

  // context('#getDownloadUrl', () => {
  //   vcr.it('get download url', async function () {
  //     const dwg = { filename: 'house-room', id: '105068' };
  //
  //     filesUrlRequest();
  //     filesUrlRequest();
  //     filesUrlRequest();
  //     const res = await scraper.getDownloadUrl(dwg);
  //
  //     debug(res);
  //     expect(res).to.be.match(/http:\/\/dl[0-9]{2}/);
  //   });
  // });

  context('#getDwgData', () => {
    vcr.it('get dwg & img', async function () {
      const pageUrl = 'http://www.bibliocad.com/library/mech--elect--plumb/1';
      const urls = await scraper.dwgUrlsFromPage(pageUrl);

      const dwgUrl = _.first(urls);

      const dwg = await scraper.getDwgData(dwgUrl);

      debug(dwg);
      expect(dwg.img).to.match(/http:\/\/img[0-9]{2}/);
    });
  });

  context('#getDwgUrls', () => {
    vcr.it('should get all dwg urls for category', async function () {
      const url = 'http://www.bibliocad.com/library/mech--elect--plumb';
      const urls = await scraper.getDwgUrls(url);

      expect(urls[0]).to.match(/_[0-9]{4,6}$/);
    });
  });

  context('#save', () => {
    vcr.it('save dwg from url', async function () {
      const pageUrl = 'http://www.bibliocad.com/library/mech--elect--plumb/1';
      const urls = await scraper.dwgUrlsFromPage(pageUrl);
      const dwgUrl = _.first(urls);

      filesUrlRequest();

      const dwg = await scraper.saveFromUrl(dwgUrl); // eslint-disable-line
    });
  });
});
