// import yargs from 'yargs'
// import Debug from 'debug'
// import Queue from 'bull'
// import Scraper from './scraper'
// import foreach from 'generator-foreach'
// import co from 'co'
// import _ from 'lodash'
//
// let debug = Debug('test')
// let q
// let host = yargs.argv.host || 'localhost'
// let scraper = new Scraper()
//
// if(yargs.argv.start){
//   co(function*(){
//     let result = yield* scraper.getRefMatch('http://www.bibliocad.com/', '#collections li>a')
//     result = _.filter(result, url=>{
//       return !/\#/.test(url)
//     })
//
//     result = _.map(result, cat=>{
//       return `http://www.bibliocad.com${cat}`
//     })
//     let q = Queue('dwg', 6379, host)
//     yield* foreach(result, function*(cat){
//       cat = cat.match(/(.+)\/[0-9]+$/)[1]
//       yield scraper.getDwgUrls(cat, dwgUrl=>{
//         debug(dwgUrl)
//         q.add({url: dwgUrl})
//       })
//     })
//     // process.exit()
//   })
// }
// else{
//   startQueue()
// }
//
// function startQueue(){
//   q = Queue('dwg', 6379, host)
//   let { name } = q
//   q.process(processDwg)
//   // q.resume()
//   return q
// }
// function processDwg(job, done){
//   co(function*(){
//     // debug(job)
//     let data = yield* scraper.saveFromUrl(job.data.url)
//     debug(data)
//     return data
//   })
//   .then(data=>{
//     debug(data)
//     done(null)
//   })
//   .catch(err=>{
//     debug(err)
//     done(err)
//   })
// }
"use strict";