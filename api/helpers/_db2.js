//MySQL Database Helper Functions

const mysql = require('mysql2');

var _MYSQL = {};

module.exports = function (server, restify) {

	initialize = function (callback) {
		if (CONFIG.dbmysql.enable) {

			if (Array.isArray(CONFIG.dbmysql)) {
				_.each(CONFIG.dbmysql, function (conf, k) {
					if (conf.keyid == null) conf.keyid = "MYSQL" + k;

					// _MYSQL[conf.keyid] = mysql.createConnection(CONFIG.dbmysql);
					// _MYSQL[conf.keyid].connect();

					_MYSQL[conf.keyid] = mysql.createPool(conf);
					//.filter(a=>["host","port","user","password","database","insecureAuth","connectionLimit","debug"].indexOf(a)>=0)

					console.log("MYSQL Initialized - " + conf.keyid);
				})
			} else {
				// _MYSQL["MYSQL0"] = mysql.createConnection(CONFIG.dbmysql);
				// _MYSQL["MYSQL0"].connect();

				_MYSQL["MYSQL0"] = mysql.createPool(CONFIG.dbmysql);
				//.filter(a=>["host","port","user","password","database","insecureAuth","connectionLimit","debug"].indexOf(a)>=0)

				_MYSQL["MYSQL0"].getConnection(function (err, connection) {
					if (err || connection == null) {
						throw err;
						return;
					}

					console.log("MYSQL Initialized with _db3 - MYSQL0");
				});
			}
		}
	}

	//Standard MySQL
	db3_query = function (dbkey, sql, params, connection) {
		return new Promise((resolve, reject) => {
			if (connection) {
				if (CONFIG.log_sql) {
					console.log("SQL", sql, params);
				}

				connection.query(sql, params, function (err, results, fields) {
					if (err) {
						return reject(err);
					}
					if (results.length <= 0) {
						return resolve([]);
					}
					resolve(JSON.parse(JSON.stringify(results)));
				});
			} else {
				if (_MYSQL[dbkey] == null) {
					return reject(`Database Not Connected for ${dbkey}`);
				}

				if (CONFIG.log_sql) {
					console.log("SQL", sql, params);
				}

				_MYSQL[dbkey].query(sql, params, function (err, results, fields) {
					if (err) {
						return reject(err);
					}
					if (results.length <= 0) {
						return resolve([]);
					}
					resolve(JSON.parse(JSON.stringify(results)));

				});
			}
		});
	};

	db3_selectQ = function (dbkey, table, columns, where, whereParams, connection, additionalQueryParams) {
		return new Promise((resolve, reject) => {
			let columnsStr;

			if (Array.isArray(columns)) columnsStr = columns.join(",");
			else columnsStr = columns;

			let sql = "SELECT " + columnsStr + " FROM " + table + " ";

			if (where != null) {
				let sqlWhere = [];
				if (typeof where == "object" && !Array.isArray(where)) {
					_.each(where, function (a, b) {
						if (a == "RAW") {
							sqlWhere.push(b);
						} else if (Array.isArray(a) && a.length == 2) {
							sqlWhere.push(b + a[1] + "'" + a[0] + "'");
						} else {
							sqlWhere.push(b + "='" + a + "'");
						}
					});
				} else {
					sqlWhere.push(where);
				}

				if (sqlWhere.length > 0) {
					sql += " WHERE " + sqlWhere.join(" AND ");
				}
			}

			if (additionalQueryParams != null && additionalQueryParams.length > 0) {
				sql += additionalQueryParams;
			}

			if (CONFIG.log_sql) {
				console.log("SQL", sql, whereParams);
			}

			const queryCallback = (err, results) => {
				if (err || results.length <= 0) {
					console.log(err || "No results found");
					reject(err || "No results found");
					return;
				}

				results = JSON.parse(JSON.stringify(results));
				resolve(results);
			};

			if (connection) {
				connection.query(sql, whereParams, queryCallback);
			} else {
				if (_MYSQL[dbkey] == null) {
					console.log("\x1b[31m%s\x1b[0m", `DATABASE Not Connected for ${dbkey}`);
					reject("Database not connected");
					return;
				}

				_MYSQL[dbkey].query(sql, whereParams, queryCallback);
			}
		});
	};

	db3_insertQ1 = function (dbkey, table, data, connection) {
		return new Promise((resolve, reject) => {
			let cols = [], quest = [], vals = [];
			_.each(data, function (a, b) {
				cols.push(b);
				vals.push(a);
				quest.push("?");
			});

			const sql = `INSERT INTO ${table} (${cols.join(",")}) VALUES (${quest.join(",")})`;

			if (CONFIG.log_sql) {
				console.log("SQL", sql, vals);
			}

			if (connection) {
				connection.query(sql, vals, function (err, results) {
					if (err) {
						return reject(err);
					}
					resolve(results.insertId);
				});
			} else {
				if (_MYSQL[dbkey] == null) {
					return reject(`Database Not Connected for ${dbkey}`);
				}

				_MYSQL[dbkey].query(sql, vals, function (err, results) {
					if (err) {
						return reject(err);
					}
					resolve(results.insertId);
				});
			}
		});
	};

	db3_insert_batchQ = function (dbkey, table, data, connection) {
		return new Promise((resolve, reject) => {
			if (connection) {
				if (data[0] == null) {
					return reject("Data Not Defined");
				}

				let cols = Object.keys(data[0]);
				let values = data.map(obj => cols.map(key => obj[key]));

				var sql = "INSERT INTO " + table + " (" + cols.join(",") + ") VALUES ?";

				if (CONFIG.log_sql) {
					console.log("SQL", sql, data);
				}

				connection.query(sql, [values], function (err, results, fields) {
					if (err) {
						console.log(err);
						return reject(err);
					}
					resolve(true);
				});

			} else {
				if (_MYSQL[dbkey] == null) {
					console.log("\x1b[31m%s\x1b[0m", `DATABASE Not Connected for ${dbkey}`);
					return reject("Database Not Connected");
				}

				if (data[0] == null) {
					return reject("Data Not Defined");
				}

				let cols = Object.keys(data[0]);
				let values = data.map(obj => cols.map(key => obj[key]));

				var sql = "INSERT INTO " + table + " (" + cols.join(",") + ") VALUES ?";

				if (CONFIG.log_sql) {
					console.log("SQL", sql, data);
				}

				_MYSQL[dbkey].query(sql, [values], function (err, results, fields) {
					if (err) {
						console.log(err);
						return reject(err);
					}
					resolve(true);
				});
			}
		});
	};

	db3_deleteQ = function (dbkey, table, where, connection) {
		return new Promise((resolve, reject) => {
			let sqlWhere = [];
			if (typeof where === "object" && !Array.isArray(where)) {
				_.each(where, function (a, b) {
					if (a === "RAW") {
						sqlWhere.push(b);
					} else if (Array.isArray(a) && a.length === 2) {
						sqlWhere.push(b + a[1] + "'" + a[0] + "'");
					} else {
						sqlWhere.push(b + "='" + a + "'");
					}
				});
			} else {
				sqlWhere.push(where);
			}

			const sql = "DELETE FROM " + table + " WHERE " + sqlWhere.join(" AND ");

			if (CONFIG.log_sql) {
				console.log("SQL", sql, sqlWhere);
			}

			const queryCallback = (err, results, fields) => {
				if (err) {
					console.log(err);
					reject(false);
					return;
				}else if (results.affectedRows === 0) {
					console.log("Rows affected: ", results.affectedRows);
					reject(false);
					return;
				}
				resolve(true);
			};

			if (connection) {
				connection.query(sql, queryCallback);
			} else {
				if (_MYSQL[dbkey] === null) {
					console.log("\x1b[31m%s\x1b[0m", `DATABASE Not Connected for ${dbkey}`);
					reject(false);
					return;
				}

				_MYSQL[dbkey].query(sql, queryCallback);
			}
		});
	};

	db3_updateQ = function (dbkey, table, data, where, connection) {
		return new Promise((resolve, reject) => {
			var fData = [];
			var vals = [];

			_.each(data, function (a, b) {
				fData.push(b + "=?");
				vals.push(a);
			});

			var sqlWhere = [];

			if (typeof where === "object" && !Array.isArray(where)) {
				_.each(where, function (a, b) {
					if (a === "RAW") {
						sqlWhere.push(b);
					} else if (Array.isArray(a) && a.length === 2) {
						sqlWhere.push(b + a[1] + "'" + a[0] + "'");
					} else {
						sqlWhere.push(b + "='" + a + "'");
					}
				});
			} else {
				sqlWhere.push(where);
			}

			var sql = "UPDATE " + table + " SET " + fData.join(",") + " WHERE " + sqlWhere.join(" AND ");

			if (CONFIG.log_sql) {
				console.log("SQL", sql, vals);
			}

			const queryCallback = (err, results, fields) => {
				if (err) {
					console.log(err);
					reject(false);
					return;
				}else if (results.affectedRows === 0){
					console.log("Rows affected: ", results.affectedRows);
					reject(false);
					return;
				}
				
				resolve(true);
			};

			if (connection) {
				connection.query(sql, vals, queryCallback);
			} else {
				if (_MYSQL[dbkey] === null) {
					console.log("\x1b[31m%s\x1b[0m", `DATABASE Not Connected for ${dbkey}`);
					reject(false);
					return;
				}

				_MYSQL[dbkey].query(sql, vals, queryCallback);
			}
		});
	};

	db3_startTransaction = function (dbkey) {
		return new Promise((resolve, reject) => {
			if (_MYSQL[dbkey] == null) {
				return reject(`Database Not Connected for ${dbkey}`);
			}

			_MYSQL[dbkey].getConnection(function (err, connection) {
				if (err || connection == null) {
					return reject(`Error getting connection for ${dbkey}`);
				}

				connection.beginTransaction(function (err) {
					if (err) {
						connection.release();
						return reject(`Error starting transaction for ${dbkey}`);
					}
					resolve(connection);
				});
			});
		});
	};

	db3_commitTransaction = function (connection) {
		return new Promise((resolve, reject) => {
			connection.commit(function (err) {
				if (err) {
					connection.rollback(function () {
						connection.release();
						reject("Error committing transaction");
					});
				} else {
					console.log("Transaction committed successfully");
					connection.release();
					resolve(true);
				}
			});
		});
	};

	db3_rollbackTransaction = function (connection) {
		return new Promise((resolve, reject) => {
			connection.rollback(function () {
				console.log("Transaction rolled back");
				connection.release();
				reject("Transaction rolled back");
			});
		});
	};

	return this;
}