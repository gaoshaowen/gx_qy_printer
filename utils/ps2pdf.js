const path = require('path')
const os = require("os")
const dirhelp = require("./DirectoryHelper")


module.exports ={
    execcmd:function(cmd){
        var exec = require('child_process').exec, child;

        var  ostype =  os.type().toString()
        var exec_path = cmd //` java -jar ${ signapk }  ${ pem }  ${pk8} ${src_file}  ${targname}`;

        if (ostype=="Linux") {
            exec_path = " sudo " + exec_path
        }

        console.log('exec_path: ', exec_path)
        let p = new Promise( (resolve, reject)=>{

            child = exec(exec_path,function (error, stdout, stderr){          
                if(error !== null){   

                    console.log( error)

                    return reject( {code:1, msg: error} )
                }
                
                console.log('success')
                return resolve({code:0, msg:'' })     
            })

        })
    
        return p

    },

    pstopdf: async function( srcfile, tagfile ){
        let newfile = tagfile
        let psfilename =srcfile

        let cmd =`gs -o ${newfile} -sDEVICE=pdfwrite ${psfilename}`

        try {

           await this.execcmd( cmd)
           return true 

        } catch (error) {
            console.log(error)
           return false 
        }

    }

}

  