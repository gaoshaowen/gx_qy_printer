const readline = require('readline');
const fs = require('fs');
const proc =require('child_process')

const FormStream = require('formstream');
const httpclient = require('urllib');
const path = require('path')
const httphelp = require('./httphelper')
var conf=require('./config');
const moment = require('moment')

module.exports ={
    uploadfile: async function(filenames){
        
        // 构造对应的 form stream
        const form = new FormStream();
        // form.field('foo', 'bar'); // 设置普通的 headers
        filenames.forEach( item =>{
        form.file(item.keyname , item.filepath ); // 添加文件，上传当前文件本身用于测试
        })
    
        // form.file('file2', __filename); // 执行多次来添加多文件
        
        // 发起请求
        const url = conf.uploadhost + 'uploadapi/doUpload';
        const result = await httpclient.request(
            url, 
            {
                dataType: 'json',
                method: 'POST',
                
                // 生成符合 multipart/form-data 要求的请求 headers
                headers: form.headers(),
                // 以 stream 模式提交
                stream: form,
            }
        )
        
        console.log( 'result:', JSON.stringify( result.data.url) );
        return result.data.url
    },

    get_color: function(file_name){

        return new Promise( (resolve, reject) =>{

            var color = 'black';
            var cmd = 'gs -o - -sDEVICE=inkcov ' + file_name;
            proc.exec(cmd, {encoding: 'utf-8'}, function(err, stdout, stderr) {
                if (err) {
                    console.log(error.stack);
                    console.log('Error code: ' + error.code);
                    console.log('Signal received: ' + error.signal);
                    return reject(err)
                }
        
                var lines = stdout.split('\n');
                lines.forEach(function(item,index){
                    if ('color' != color){
                        pos = item.indexOf('CMYK OK');
                        if (pos > -1){
                            item = item.trim();
                            cmyk = item.substr(0, pos).split('  ');
                            
                            if (cmyk.length == 4){
                                //console.log('get cmyk succ');
                                for (var i = 0; i < cmyk.length; i++) {
                                    if ((cmyk[i] != '0.00000') && (i < cmyk.length-1)){
                                        color = 'color';
                                        //console.log(cmyk[i] + ' is color ' + i);
                                        break;
                                    }
                                    //console.log(i, cmyk[i]);
                                }
                                
                            }
                        }
                    }
                });

                //callback(color);

                return resolve(color)
        
            }).on('exit', function (code) {
                //console.log('子进程已退出, 退出码 ' + code);
            })
        })

    },

    
    get_ps_obj: function(file_name){
        return new Promise( (resolve, reject) =>{

            const rl = readline.createInterface({
                input: fs.createReadStream(file_name , 'utf-8')
            })

            var ps_obj={}
            ps_obj.page_num = 0;
            rl.on('line', (line) => {
                //'%%BeginFeature: *PageSize'
                substr = '%%BeginFeature: *PageSize';
                pos = line.indexOf(substr);
                if (pos > -1){
                    tmp = line.substring(pos + substr.length+1);
                    ps_obj.page_size = tmp;
            
                }else if (line.indexOf('Duplex true') > -1){
                    ps_obj.duplex = true;
                }else if (line.indexOf('%%Page:') > -1){
                    ps_obj.page_num++;
                }
            
            })
            
            rl.on('close', ()=>{
                resolve(ps_obj)
            })

        })

        
    }




}