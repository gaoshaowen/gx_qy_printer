const mysql = require( 'mysql2' );
const conf = require('./config')
var async = require("async");


var pool = mysql.createPool( {
  connectionLimit : 50,
  host      : conf.mysql.host,
  user      : conf.mysql.user,
  password  : conf.mysql.password,
  database  : conf.mysql.database,
  multipleStatements : true //是否允许执行多条sql语句
} );


const promisePool = pool.promise();

//将结果已对象数组返回
var find= async( sql , ...params )=>{
    const [rows,fields] = await promisePool.query( sql, params)
    
    return {rows, fields}
};

//返回一个对象
var first= async ( sql , ...params )=>{
    const [rows,fields] = await promisePool.query( sql, params)
    return rows[0] || null 
};

//返回单个查询结果
var single= async (sql , ...params )=>{

    const [rows,fields] = await promisePool.query( sql, params)
    //return rows[0][0] || null 
    for( let i in rows[0] )
    {
      return rows[0][i] || null ;
    }
}

var addmodel =  (tbname , obj )=>{
  let {sql, val} = getaddsql( tbname, obj);
  console.log( 'sql:',sql )
  console.log( 'val:',val )

  return exec(sql, ...val)
}

var deletemodel=  (tbname , id )=>{
  let {sql, val} = getdeletesql( tbname, id);
  console.log( 'sql:',sql )
  console.log( 'val:',val )

  return exec(sql, ...val)
}

var updatemodel =  (tbname , obj, id )=>{
  let {sql, val} = getupdatesql( tbname, obj, id);
  console.log( 'sql:',sql )
  console.log( 'val:',val )
  return exec(sql, ...val)
}


//执行代码，返回执行结果
var exec= async (sql , ...params )=>{
    const [rows,fields] = await promisePool.execute(sql,params)
   // console.log(rows)
    return rows 
}

var getupdatesql =( tbname , updateobj , id )=>{
  let sql=''
  let val =[]
  for(var key in updateobj){
    sql =sql + ',' +key + '=?'
    val.push( updateobj[key] )
  }

  sql ='update ' + tbname + ' set ' + sql.substring(1) + ' where id =?' 
  val.push(id)

  return { sql, val}
}


var getdeletesql =( tbname , id )=>{
  let sql='delete from  ' + tbname + ' where id =?' 
  let val =[id]
 
  return { sql, val}
}


var getaddsql =( tbname , addobj)=>{
  let sql=''
  let val =[]
  for(var key in addobj){
    sql =sql + ',' +key + '=?'
    val.push( addobj[key] )
  }

  sql ='insert into ' + tbname + ' set ' + sql.substring(1)

  return { sql, val}
}

function getSqlParamEntity(sql, params, callback) {
  if (callback) {
      return callback(null, {
          sql: sql,
          params: params
      });
  }
  return {
      sql: sql,
      params: params
  };
}

function execTrans(sqlparamsEntities, callback) {
  pool.getConnection(function (err, connection) {
      if (err) {
          return callback(err, null);
      }
      connection.beginTransaction(function (err) {
          if (err) {
              return callback(err, null);
          }
          console.log("开始执行transaction，共执行" + sqlparamsEntities.length + "条数据");
          var funcAry = [];
          sqlparamsEntities.forEach(function (sql_param) {
              var temp = function (cb) {
                  var sql = sql_param.sql;
                  var param = sql_param.params;
                  console.log(sql)
                  connection.query(sql, param, function (tErr, rows, fields) {
                      if (tErr) {
                          connection.rollback(function () {
                              console.log("事务失败，" + sql_param + "，ERROR：" + tErr);
                              throw tErr;
                          });
                      } else {
                          return cb(null, 'ok');
                      }
                  })
              };
              funcAry.push(temp);
          });

          async.series(funcAry, function (err, result) {
              console.log("transaction error: " + err);
              if (err) {
                  connection.rollback(function (err) {
                      console.log("transaction error: " + err);
                      connection.release();
                      return callback(err, null);
                  });
              } else {
                  connection.commit(function (err, info) {
                      console.log("transaction info: " + JSON.stringify(info));
                      if (err) {
                          console.log("执行事务失败，" + err);
                          connection.rollback(function (err) {
                              console.log("transaction error: " + err);
                              connection.release();
                              return callback(err, null);
                          });
                      } else {
                          connection.release();
                          return callback(null, info);
                      }
                  })
              }
          })
      });
  });
}





//模块导出
module.exports = {find ,first , single ,exec,getupdatesql,getaddsql,getdeletesql , addmodel, deletemodel, updatemodel,execTrans,getSqlParamEntity }