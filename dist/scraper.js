'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _coRequest = require('co-request');

var _coRequest2 = _interopRequireDefault(_coRequest);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _cheerio = require('cheerio');

var _cheerio2 = _interopRequireDefault(_cheerio);

var _storage = require('storage');

var _storage2 = _interopRequireDefault(_storage);

var _db = require('db');

var _db2 = _interopRequireDefault(_db);

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

var _ms = require('ms');

var _ms2 = _interopRequireDefault(_ms);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const db = (0, _db2.default)();
let { File } = db.models;
const storage = new _storage2.default();
const imgStorage = new _storage2.default('cadimg');

let debug = (0, _debug2.default)('test');
let url = 'http://www.bibliocad.com/';

class Scraper {
  *getCategoryUrls() {
    let { body } = yield (0, _coRequest2.default)(url);
    let $ = _cheerio2.default.load(body);
    // $('#collections a').forEach(a=>{
    //   console.log(a);
    // })
    // return $('#collections').html()
    let results = _lodash2.default.map($('li>a'), a => {
      return $(a).attr('href');
    });
    debug(results);
  }
  *getRefMatch(url, match) {
    let { body } = yield (0, _coRequest2.default)(url);
    let $ = _cheerio2.default.load(body);
    let results = _lodash2.default.map($(match), a => {
      return $(a).attr('href');
    });
    return results;
  }
  *getMaxPageForCategory(catUrl) {
    let urls = yield this.getRefMatch(catUrl, '.pagination a');
    let pages = [];
    urls.forEach(url => {
      let match = url.match(/[0-9]*$/);
      match = _lodash2.default.first(match);
      match = parseInt(match);
      if (!_lodash2.default.isNaN(match)) pages.push(match);
    });
    pages = _lodash2.default.max(pages);
    return pages;
  }
  *dwgUrlsFromPage(pageUrl) {
    let urls = yield this.getRefMatch(pageUrl, '.thumb-title');
    return urls;
  }
  *getDwgData(dwgUrl) {
    let data = {};
    let match = dwgUrl.match(/([^\/]+)\_([0-9]+)$/);
    data.file_id = match[2];
    data.file_title = match[1];
    dwgUrl = `http://www.bibliocad.com${ dwgUrl }`;
    let { body } = yield (0, _coRequest2.default)(dwgUrl);
    let $ = _cheerio2.default.load(body);
    //get tags
    data.tags = $('.tags li span');
    data.tags = _lodash2.default.map(data.tags, t => {
      return $(t).html();
    });
    //get img
    let $img = $('#imgprevdef');
    data.img = $img.attr('src');
    //get title
    let title = $img.attr('alt').match(/^(.*)\(/);
    if (title.length > 3) data.title = title[1];else data.title = $img.attr('alt');
    data.downloadUrl = yield this.getDownloadUrl(data);
    data.ext = _lodash2.default.first(data.downloadUrl.match(/([^\.]*)$/));
    return data;
  }
  *getDownloadUrl(dwg) {
    let data = _lodash2.default.pick(dwg, ['file_id', 'file_title']);
    data.file_type = 'file';
    data.file_extension = 'zip';
    data.time = new Date().getTime();
    let res = yield (0, _coRequest2.default)({
      method: 'POST',
      uri: 'http://www.bibliocad.com/xhr/files-url',
      headers: {
        Cookie: '__cfduid=db1e52ca55a89fe2a06d220a8e9c6f8691434399816; slng=en; sid=c48f963cda8b81e9872a250931f142c6; suid=2326777; suname=kiriantello; semail=kirian.tello.salas%40gmail.com; semailvalid=1; semailvaliddate=0000-00-00+00%3A00%3A00; scandownload=1; svip=NO; svipto=0000-00-00; scountry=MX; test=test; _gat=1; _ga=GA1.2.38388818.1434399821; __atuvc=5%7C24; __atuvs=55803f69694f5b19003'
      },
      formData: data
    });
    let url = JSON.parse(res.body).db;
    return url;
  }
  //get all dwg urls
  *getDwgUrls(url, cb) {
    let ctx = this;
    let max = yield this.getMaxPageForCategory(url);
    while (max > 0) {
      let reqs = [];
      for (var i = 0; i < 5; i++) {
        debug(`${ url }/${ max }`);
        reqs.push(ctx.dwgUrlsFromPage(`${ url }/${ max }`));
        max -= 1;
      }
      let res = yield reqs;
      let _urls = _lodash2.default.reduce(res, (all, urls) => {
        all = all || [];
        return all.concat(urls);
      });
      _urls.forEach(cb);
    }
  }
  *save(dwg) {
    let { ext } = dwg;
    let file = new File(_lodash2.default.omit(dwg, ['file_id', 'file_title']));
    file.set('filename', `${ file._id }.${ ext }`);
    let get = _superagent2.default.get(file.downloadUrl);
    yield storage.putStreamBuffer(get, file.filename, { 'Content-Type': 'application/zip' });
    let img = _superagent2.default.get(file.img);
    file.set('img', `${ file._id }.jpg`);
    yield imgStorage.putStreamBuffer(img, file.img, { 'Content-Type': 'image/jpeg' });
    let _file = yield file.save();
    return file;
  }
  *saveFromUrl(url) {
    let dwg = yield this.getDwgData(url);
    return yield this.save(dwg);
  }
}
exports.default = Scraper;