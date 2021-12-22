const mysql = require("mysql");

exports.pusacho = mysql.createPool({
  connectionLimit: 100,
  host: "192.168.64.3",
  user: "username",
  password: "password",
  database: "pusacho"
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