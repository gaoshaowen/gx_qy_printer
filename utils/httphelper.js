// 引入 axios
const axios =require('axios')
const conf  =require("./config")

axios.interceptors.response.use(undefined, function axiosRetryInterceptor(err) {
  var config = err.config;
  // If config does not exist or the retry option is not set, reject
  if(!config || !config.retry) return Promise.reject(err);
  
  // Set the variable for keeping track of the retry count
  config.__retryCount = config.__retryCount || 0;
  
  // Check if we've maxed out the total number of retries
  if(config.__retryCount >= config.retry) {
      // Reject with the error
      return Promise.reject(err);
  }
  
  // Increase the retry count
  config.__retryCount += 1;
  
  // Create new promise to handle exponential backoff
  var backoff = new Promise(function(resolve) {
      setTimeout(function() {
          resolve();
      }, config.retryDelay || 1);
  });
  
  // Return the promise in which recalls axios to retry the request
  return backoff.then(function() {
      return axios(config);
  });
});


var httphelper = {

  uploadhost: conf.uploadhost,

  fileUploadAPI: conf.uploadhost+ 'uploadapi/doUpload',//"/api/uploadapi/doUpload",
  fileDeleteAPI: conf.uploadhost+ 'uploadapi/delfile',//"/api/uploadapi/doUpload",

  /** get 请求
   * @param  {接口地址} url
   * @param  {请求参数} params
   */
  get: function(url,params){
    return new Promise((resolve,reject) => {
      axios.get(url,{
        params:params
      })
      .then((response) => {
        resolve( response.data );
      })
      .catch((error) => {
        reject( error );
      });
    })
  },
  /** post 请求
   * @param  {接口地址} url
   * @param  {请求参数} params
   */
  post: function(url,params, config){
    return new Promise((resolve,reject) => {
      //{ retry: 5, retryDelay: 1000 }
      // params.retry =5;
      // params.retryDelay =1000;
      // params.timeout = 24000;

      axios.post(url,params,config)
      .then((response) => {
        resolve( response.data );
      })
      .catch((error) => {
        reject( error );
      })
      
    })
  },

  uploadfile: function( params, config){
    return this.post( this.fileUploadAPI ,params, config)
  },

  deletefile: function(url){
    
    return this.get( this.fileDeleteAPI+url)

  },


  deletefile2: async function (urlpath) {
      // let delurl=''
      // let index =-1
      let newurl = urlpath.replace('download', 'uploadapi/delfile')
      console.log('delurl', newurl)

      try {
        let deletedata =await this.get(newurl)  //await this.deletefile(delurl)
        console.log ('delete ', urlpath, '  ', deletedata.msg)

          //download?file=xxxx&root=xxxx
          //uploadapi/delfile
          
          // index = urlpath.indexOf("?")
          // if ( index >-1) {
          //     delurl =urlpath.substring( index)
          //     let deletedata =await this.get( )  //await this.deletefile(delurl)
          //     console.log ('delete ', urlpath, '  ', deletedata.msg )
          // }
  
      } catch (error) {
        console.log(" delete ", urlpath ," err:" + error);
      }

   },


}

module.exports = httphelper
