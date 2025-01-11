const mysql = require("mysql");

exports.pusacho = mysql.createPool({
  connectionLimit: 100,
  host: process.env.DB_HOSTNAME,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});
/**
 * execute database query with Promise
 * sql: SQL query
 * args: sql arguments, to prevent SQL injection.
 */
exports.execute = (db, sql, args) => {
  return new Promise((resolve, reject) => {
    db.query(sql, args, (error, results, fields) => {
      if (error) reject(error);
      else resolve(results);
    });
  });
};