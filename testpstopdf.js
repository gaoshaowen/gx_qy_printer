(async function(){
  
    var fc = require('./utils/filechange')
    var dirhelp = require('./utils/DirectoryHelper')
    var path = require('path')

    var rootdir = path.join(__dirname , './printjobs')

    dirhelp.mkdirsSync( rootdir);
    var psdir  = path.join(rootdir, 'ps'  )
    dirhelp.mkdirsSync( psdir);
    var pdfdir = path.join(rootdir, 'pdf' )
    dirhelp.mkdirsSync( pdfdir);


    var filename = 'printjob-1-1568540068292.' //dirhelp.getUploadFileName('')
    
    var srcfilename =path.join(psdir,  filename +'ps')
    var targfilename = path.join(pdfdir,  filename +'pdf')


    console.log('srcfilename: ', srcfilename)
    console.log('targfilename: ', targfilename)

    await fc.pstopdf(srcfilename ,targfilename )


})()