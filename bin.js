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
var loghelp = require('./utils/loghelp')
var moment =require('moment')

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

  job.pipe(fs.createWriteStream(psfile)).on('finish', async  ()=>{
    
    loghelp.logger.info('printed:', psfile )
    //2. 保存数据PDF文件
    // let bl =await fc.pstopdf(psfile ,pdffile )
    // if (! bl){
    //   return 
    // }

  
    //3.上传文件  
    // let pdffile = path.join( __dirname, './tongzhi.pdf'  )
    var filenames =[
      {keyname:'psfile', filepath:psfile },
      // {keyname:'pdffile', filepath:pdffile }
    ]


    try {
      var returl = await util.uploadfile( filenames)
    } catch (error) {
      loghelp.logger.error('uploadfile: ',error);    
      return 
    }

    let psurl =conf.uploadhost + returl.psfile.path
    let pdfurl =pdffile
    if (returl.pdffile && returl.pdffile.path ){
      pdfurl = conf.uploadhost + returl.pdffile.path
    }
    

    //4. 得到打印参数
    let color ='black'
    // try {
    //   color = await util.get_color()
    // } catch (error) {
    //   loghelp.logger.error('get_color: ',error);
    //   color="black"
    // }
   
    let ps_obj ={}
    try {
      ps_obj = await util.get_ps_obj(psfile  )
    } catch (error) {
      loghelp.logger.error('get_color: ',error);
    }

    loghelp.logger.info('ps_obj: ', ps_obj)
    let copies =1

    //5. 保存数据库 
    let jsonobj ={
      id: id,
      print_host: job.host,
      print_by: job.userName,
      doc_name: job.name,
      dept_id: '', 
      dept_name: '', 
      print_time: moment( new Date(), '').format('YYYY-MM-DD HH:mm:ss'),
      pagesize: ps_obj.page_size, 
      colormode: color, 
      duplex: ps_obj.duplex? 1:0, 
      copies: copies, 
      total_pages	: ps_obj.page_num * copies , 
      price	: 1, 
      money	: 1, 
      doc_url	: psurl, 
      pdf_url: pdfurl,
      shenhe_by	: '', 
      shenhe_status	: 0,  //待审核 1： 审核通过，2: 审核不通过
      print_status	: 0    //	0：未打印,  1: 打印发送成功 2: 打印成功 3: 打印失败
     
    }

    loghelp.logger.info('jsonobj:', jsonobj )

    let url= conf.dataapi +'print_job/add';
    httphelp.post(url, jsonobj ).then(data =>{

      loghelp.logger.info('post data:', data )
      loghelp.logger.info('post data.code:', data.code)
    }).catch(error =>{
      loghelp.logger.error(error);
    })
    
  })

})

p.server.on('listening', function () {
  console.log('ipp-printer listening on:', url.format({protocol: 'http', hostname: ip, port: config.port}))
})




