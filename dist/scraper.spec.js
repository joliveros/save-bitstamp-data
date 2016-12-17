'use strict';

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _chai = require('chai');

var _scraper = require('./scraper.js');

var _scraper2 = _interopRequireDefault(_scraper);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _generatorForeach = require('generator-foreach');

var _generatorForeach2 = _interopRequireDefault(_generatorForeach);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let debug = (0, _debug2.default)('test');
let scraper = new _scraper2.default();
describe('Scraper', function () {
  this.timeout(1000 * 60);
  it('should get hrefs at url', function* () {
    let result = yield scraper.getRefMatch('http://www.bibliocad.com/', 'li>a');
    (0, _chai.expect)(result).to.be.array;
  });
  // it('get pages?', function*(){
  //   let host = 'http://www.bibliocad.com'
  //   let result = yield scraper.getRefMatch('http://www.bibliocad.com/', 'li>a')
  //   result = _.filter(result, a=>{
  //     return !a.match(/\#/)
  //   })
  //   yield* foreach(result, function*(url){
  //       url = `${host}${url}`
  //       debug(url)
  //       url = yield scraper.getRefMatch(url, 'li>a')
  //       debug(url)
  //     // try{
  //     // }catch(err){

  //     // }

  //   })
  // })
  it('get pagination urls', function* () {
    let url = 'http://www.bibliocad.com/library/mech--elect--plumb';
    url = yield scraper.getRefMatch(url, '.pagination a');
    url.forEach(url => {
      (0, _chai.expect)(url.indexOf(url)).to.be.equal(0);
    });
  });
  it('get max pages', function* () {
    let url = 'http://www.bibliocad.com/library/mech--elect--plumb';
    url = yield scraper.getMaxPageForCategory(url);
    (0, _chai.expect)(url).to.be.number;
  });
  it('get each page', function* () {
    let pageUrl = 'http://www.bibliocad.com/library/mech--elect--plumb/1';
    let urls = yield scraper.dwgUrlsFromPage(pageUrl);
    urls.forEach(url => {
      (0, _chai.expect)(/\_[0-9]+$/.test(url)).to.be.true;
    });
  });
  it('get dwg \& img', function* () {
    let pageUrl = 'http://www.bibliocad.com/library/mech--elect--plumb/1';
    let urls = yield scraper.dwgUrlsFromPage(pageUrl);
    let dwgUrl = _lodash2.default.first(urls);
    let dwg = yield scraper.getDwgData(dwgUrl);
    debug(dwg);
  });
  it('get download url', function* () {
    let pageUrl = 'http://www.bibliocad.com/library/mech--elect--plumb/1';
    let urls = yield scraper.dwgUrlsFromPage(pageUrl);
    let dwgUrl = _lodash2.default.last(urls);
    let dwg = yield scraper.getDwgData(dwgUrl);
    let res = yield scraper.getDownloadUrl(dwg);
    debug(res);
    (0, _chai.expect)(res).to.be.match(/http\:\/\/dl[0-9]{2,}/);
  });
  it('should get all dwg urls for category', function* () {
    let url = 'http://www.bibliocad.com/library/mech--elect--plumb';
    yield scraper.getDwgUrls(url);
  });
  it('save dwg', function* () {
    let pageUrl = 'http://www.bibliocad.com/library/mech--elect--plumb/1';
    let urls = yield scraper.dwgUrlsFromPage(pageUrl);
    let dwgUrl = _lodash2.default.first(urls);
    let dwg = yield scraper.getDwgData(dwgUrl);
    let file = yield scraper.save(dwg);
  });
  it.only('save dwg from url', function* () {
    let pageUrl = 'http://www.bibliocad.com/library/mech--elect--plumb/1';
    let urls = yield scraper.dwgUrlsFromPage(pageUrl);
    let dwgUrl = _lodash2.default.first(urls);
    let dwg = yield scraper.saveFromUrl(dwgUrl);
  });
});