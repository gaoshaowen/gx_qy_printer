#!/usr/bin/env node
'use strict'

var config = require('rc')('ipp-printer', {
  name: 'ipp-printer', dir: process.cwd(), port: 3000
})
var nonPrivate = require('non-private-ip')
var url = require('url')
var ip = nonPrivate() || nonPrivate.private()
var fs = require('fs')
var uuidV1 = require('uuid/v1');

var fc = require('./utils/ps2pdf')
var dirhelp = require('./utils/DirectoryHelper')
var path = require('path')
var httphelp =require('./utils/httphelper')
var conf = require('./utils/config')
var util =require('./utils/util')

var Printer = require('./')

var p = new Printer(config)

p.on('job',  function (job) {

  //1. 得到 guid 
  var id = uuidV1()
  
  var rootdir = path.join(__dirname , './printjobs')
  dirhelp.mkdirsSync( rootdir);
  var psdir  = path.join(rootdir, 'ps'  )
  dirhelp.mkdirsSync( psdir);
  var pdfdir = path.join(rootdir, 'pdf' )
  dirhelp.mkdirsSync( pdfdir);

  var psfile =path.join(psdir,  id +'.ps')
  var pdffile = path.join(pdfdir,  id +'.pdf')

  job.pipe(fs.createWriteStream(filename)).on('finish', async  ()=>{
    console.log('printed:', filename)

    //2. 保存数据PDF文件
    let bl =await fc.pstopdf(psfile ,pdffile )
    if (! bl){
      return 
    }


    //3.上传文件  
    // let pdffile = path.join( __dirname, './tongzhi.pdf'  )
    var filenames =[
      {keyname:'psfile', filepath:psfile },
      {keyname:'pdffile', filepath:pdffile }
    ]


    try {
      var returl = await util.uploadfile( filenames)
    } catch (error) {
       console.log(error)
      return 
    }

  
    let psurl = returl.psfile.path
    let pdfurl = returl.pdffile.path

    //4. 保存数据库 
    let jsonobj ={
      id: id,
      print_host: job.host,
      print_by: job.userName,
      doc_name: job.name,
      dept_id: '', 
      dept_name: '', 
      print_time: moment( new Date(), '').format('YYYY-MM-DD HH:mm:ss'),
      pagesize: 'A4', 
      colormode: 'black', 
      duplex: 1, 
      copies: 1, 
      total_pages	: 1, 
      price	: 1, 
      money	: 1, 
      doc_url	: psurl, 
      pdf_url: pdfurl,
      shenhe_by	: '', 
      shenhe_status	: 0,  //待审核 1： 审核通过，2: 审核不通过
      print_status	: 0    //	0：未打印,  1: 打印发送成功 2: 打印成功 3: 打印失败
     
    }

    let url= conf.dataapi +'print_job/add';
    httphelp.post(url, jsonobj ).then(data =>{

      console.log(data)
      console.log('code:', data.code)
    }).catch(err =>{
      console.log(err)
    })
    
  })

})

p.server.on('listening', function () {
  console.log('ipp-printer listening on:', url.format({protocol: 'http', hostname: ip, port: config.port}))
})




