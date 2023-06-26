const { execute, pusacho } = require("../conn/db");
const moment = require("moment");
const _ = require("lodash");
const mv = require("mv");
const json2xls = require("json2xls");

exports.getSomething = (req, res) => {
  try {
    const data = {
      data: 'data'
    }
    res.status(200).json({
      code: 200,
      message: "Ok",
      data: data
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: "Failed",
      data: `Error while getting product detail: ${'something'}`
    })
  }
}

const currencyFormat = (nominal) => {
  const number = Number(nominal);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR"
  }).format(number);
}

exports.getActivities = async (req, res) => {
  const { activeTab, keyword, categories, datestart, dateend, offset, limit } = req.query;
  // Define Conditions, Sort, Filter & Search Variables
  const offsetInt = _.isUndefined(offset) ? 0 : parseInt(offset);
  const limitInt = _.isUndefined(limit) ? 10 : parseInt(limit);
  const limitoffset = `LIMIT ${offsetInt}, ${limitInt}`;
  try{
    let wheres = [];
    if(keyword !== 'null' && keyword !== ''){
      const whereKeyword = `v.name LIKE '%${keyword}%' OR l.product_id LIKE '%${keyword}%'`;
      wheres.push(whereKeyword);
    }
    
    if(categories !== 'null' && categories !== ''){
      const whereCategory = `v.category_id IN (${categories})`;
      wheres.push(whereCategory);
    }
    
    if(datestart !== 'null' && datestart !== '' && dateend !== 'null' && dateend !== ''){
      const whereDate = `l.created_at BETWEEN '${datestart}' AND '${dateend}'`;
      wheres.push(whereDate);
    }

    const allWheres = wheres.join(' AND ');
    
    const queryGetData = activeTab === '0' ? 
      `SELECT l.id, l.product_id, v.name, v.price, a.wording, l.activity_id, 
          l.initial_value, l.final_value, l.actor_id, u.name AS actor_name, v.images AS images, l.created_at
        FROM activity_log l 
        INNER JOIN activities a ON l.activity_id = a.id 
        INNER JOIN variants v ON l.product_id = v.id
        INNER JOIN users u ON l.actor_id = u.id
        WHERE l.activity_id IN(1,2) AND ${allWheres}
        ORDER BY l.created_at DESC
        ${limitoffset};`
      :
      `SELECT l.id, l.product_id, v.name, v.price, a.wording, l.activity_id, 
          l.initial_value, l.final_value, l.actor_id, u.name AS actor_name, v.images AS images, l.created_at
        FROM activity_log l 
        INNER JOIN activities a ON l.activity_id = a.id 
        INNER JOIN variants v ON l.product_id = v.id
        INNER JOIN users u ON l.actor_id = u.id
        WHERE NOT l.activity_id = 1 AND NOT l.activity_id = 2 AND ${allWheres}
        ORDER BY l.created_at DESC
        ${limitoffset};`;

    const queryGetTotal = activeTab === '0' ? 
      `SELECT COUNT(l.id) as total
      FROM activity_log l
      INNER JOIN activities a ON l.activity_id = a.id 
      INNER JOIN variants v ON l.product_id = v.id
      INNER JOIN users u ON l.actor_id = u.id
      WHERE l.activity_id IN(1,2) AND ${allWheres}
      ORDER BY l.created_at DESC;`
      :
      `SELECT COUNT(l.id) as total
      FROM activity_log l
      INNER JOIN activities a ON l.activity_id = a.id 
      INNER JOIN variants v ON l.product_id = v.id
      INNER JOIN users u ON l.actor_id = u.id
      WHERE NOT l.activity_id = 1 AND NOT l.activity_id = 2 AND ${allWheres}
      ORDER BY l.created_at DESC;`;
    
    const data = await execute(pusacho, queryGetData);
    const [dataTotal] = await execute(pusacho, queryGetTotal);

    const queryGetAllCategory = `SELECT * FROM category`;
    const dataCategory = await execute(pusacho, queryGetAllCategory);

    let categoryList = [];
    // process categories
    if(dataCategory.length > 0){
      dataCategory.forEach((item) => {
        categoryList.push({
          value: item.id,
          label: item.name
        })
      })
    }
   

    // process activities
    let dataProcessed = {};
    if(data.length > 0){
      if(activeTab !== '0'){
        data.forEach(item => {
          item.date = moment(item.created_at).format("YYYY-MM-DD");
        });
        let groupedResultObj = _.mapValues(_.groupBy(data, 'date'),
        clist => clist.map(date => _.omit(date, 'date')));
        let groupedResArr = [];
        Object.entries(groupedResultObj).forEach(itemzz => {
          groupedResArr.push(itemzz[1]);
        });
        groupedResArr.forEach(itemzzz => {
          itemzzz.forEach((item) => {
            if(item.activity_id === 4){
              item.initial_value = currencyFormat(item.initial_value);
              item.final_value = currencyFormat(item.final_value);
            }
            else if( item.activity_id === 8){
              item.initial_value = item.initial_value.split("|").length > 1 ? item.initial_value.split("|").join(" dan ") : item.initial_value.split("|")[0];
              item.final_value = item.final_value.split("|").length > 1 ? item.final_value.split("|").join(" dan ") : item.final_value.split("|")[0];
            }
            else if( item.activity_id === 10){
              item.initial_value = item.initial_value.split("|").length > 1 ? item.initial_value.split("|").join(" dan ") : item.initial_value.split("|")[0];
              item.final_value = item.final_value.split("|").length > 1 ? item.final_value.split("|").join(" dan ") : item.final_value.split("|")[0];
            }
            else{
              let splitted = item.initial_value.split('|');
              let splitted2 = item.final_value.split('|');
              if(splitted.length > 1 && splitted2.length > 1){
                let arrInitial = [];
                let arrFinal = [];
                splitted.forEach((itemx) => {
                  arrInitial.push(currencyFormat(itemx))
                })
                splitted2.forEach((itemy) => {
                  arrFinal.push(currencyFormat(itemy))
                })
                if(splitted[1] !== '' && splitted[2] !== ''){
                  item.initial_value = arrInitial.join(" ; ");
                  item.final_value = arrFinal.join(" ; ");
                }
                else if(splitted[1] !== ''){
                  item.initial_value = arrInitial.join(" dan ");
                  item.final_value = arrFinal.join(" dan ");
                }
                else{
                  item.initial_value = arrInitial[0];
                  item.final_value = arrFinal[0];
                }
              }
            }
          })
        });
  
        dataProcessed = {
          datas: groupedResArr,
          categories: categoryList
        }
      }
      else{
        data.forEach((item) => {
          if(item.activity_id === 1){
            item.difference = Number(item.final_value) - Number(item.initial_value);
          }
          else{
            item.difference = Number(item.initial_value) - Number(item.final_value);
          }
        })
        dataProcessed = {
          datas: data,
          categories: categoryList
        };
      }
      
      res.json({
        status: 200,
        data: dataProcessed,
        meta: {
          total: dataTotal.total
        }
      });
    }
    else{
      let dataProcessed = {
        datas: [],
        categories: categoryList
      };
      res.json({
        status: 200,
        data: dataProcessed,
        meta: {
          total: 0
        }
      });
    }
    
  } catch(err){
    console.log(err);
    res.json({
      status: 500,
      message: err
    });
  }
}

exports.getStatistics = async (req, res) => {
  try{
    const queryGetData =  
      `SELECT l.initial_value, l.final_value, l.activity_id
        FROM activity_log l 
        INNER JOIN variants v ON l.product_id = v.id
        WHERE l.activity_id IN (1,2) AND l.created_at BETWEEN ? AND ?`;

    const data = await execute(pusacho, queryGetData, [moment().startOf('month').format('YYYY-MM-DD HH:mm:ss'), moment().format('YYYY-MM-DD HH:mm:ss')]);

    if(data.length > 0){
      let totalMasuk = 0;
      let totalKeluar = 0;
      data.forEach((item) => {
        if(item.activity_id === 1){
          let difference = Number(item.final_value) - Number(item.initial_value);
          totalMasuk += difference;
        }
        else{
          let difference = Number(item.initial_value) - Number(item.final_value);
          totalKeluar += difference;
        }
      })
      const dataProcessed = {
        totalMasuk: totalMasuk,
        totalKeluar: totalKeluar
      };
      res.json({
        status: 200,
        data: dataProcessed
      });
    }
    else{
      const dataProcessed = {
        totalMasuk: 0,
        totalKeluar: 0
      };
      res.json({
        status: 200,
        data: dataProcessed
      });
    }
    
    
  } catch(err){
    console.log(err);
    res.json({
      status: 500,
      message: err
    });
  }
}

exports.getUsers = async (req, res) => {

  const { keyword, roles, offset, limit } = req.query;
  // Define Conditions, Sort, Filter & Search Variables
  const offsetInt = _.isUndefined(offset) ? 0 : parseInt(offset);
  const limitInt = _.isUndefined(limit) ? 10 : parseInt(limit);
  const limitoffset = `LIMIT ${offsetInt}, ${limitInt}`;
  try{
    let wheres = [];
    if(keyword !== 'null' && keyword !== ''){
      const whereKeyword = `u.username LIKE '%${keyword}%'`;
      wheres.push(whereKeyword);
    }
    
    if(roles !== 'null' && roles !== ''){
      const whereRole = `u.role IN (${roles})`;
      wheres.push(whereRole);
    }

    const allWheres = wheres.length > 0 ? wheres.join(' AND ') : "";
    
    const queryGetData =  
      `SELECT u.id, u.name, u.username, u.role, r.description AS user_role
      FROM users u
      INNER JOIN user_role r ON u.role = r.id
      ${wheres.length > 0 ? `WHERE ${allWheres}` : ""}
      ${limitoffset}`;

    const queryGetTotal =  
      `SELECT COUNT(u.username) as total
      FROM users u
      INNER JOIN user_role r ON u.role = r.id
      ${wheres.length > 0 ? `WHERE ${allWheres}` : ""};`;
    
    const data = await execute(pusacho, queryGetData);
    const [dataTotal] = await execute(pusacho, queryGetTotal);

    if(data.length > 0){
      res.json({
        status: 200,
        data: data,
        meta: {
          total: dataTotal.total
        }
      });
    }
    else{
      res.json({
        status: 200,
        data: [],
        meta: {
          total: 0
        }
      });
    }
    
    
  } catch(err){
    console.log(err);
    res.json({
      status: 500,
      message: err
    });
  }
}

/**
 * Delete User
 * {DELETE}/manajemen/user
 */
 exports.deleteUser = async (req, res) => {
  const { id, role } = req.query;
  try {
    //Check if manajemen still exist if deleted
    if(role === '0'){
      const sqlCheck = `SELECT username FROM users WHERE role = 0`;
      const check = await execute(pusacho, sqlCheck);
      if(check.length < 2){
        res.status(400).json({
          code: 401,
          message: "Failed to delete"
        })
      }
      else{
        const sql = `DELETE FROM users WHERE id = ?`;
        const deleteUser = await execute(pusacho, sql, [id]);
        if (deleteUser.affectedRows > 0) {
          res.status(200).json({
            code: 200,
            message: "Ok"
          })
        } else {
          res.status(400).json({
            code: 400,
            message: "Failed to delete"
          })
        }
      }
    }
    else{
      const sql = `DELETE FROM users WHERE id = ?`;
      const deleteUser = await execute(pusacho, sql, [id]);
      if (deleteUser.affectedRows > 0) {
        res.status(200).json({
          code: 200,
          message: "Ok"
        })
      } else {
        res.status(400).json({
          code: 400,
          message: "Failed to delete"
        })
      }
    }
  } catch(error) {
    console.log("[Delete User] Error :", error.toString());
    res.status(500).json({
      code: 500,
      message: "Internal Server Error"
    });
  };
};

/**
 * Edit User
 * {POST}/manajemen/user
 */
 exports.editUser = async (req, res) => {
  const { id, username, password, name, role } = req.body;
  try {
    const sql = `
    UPDATE users 
    SET name = ?, role = ?, username = ?
    WHERE id = ?`;
    const editUser = await execute(pusacho, sql, [name, role, username, id]);
    if (editUser.affectedRows > 0) {
      res.status(200).json({
        code: 200,
        message: "Ok"
      })
    } else {
      res.status(400).json({
        code: 400,
        message: "Failed to edit"
      })
    }
  } catch(error) {
    console.log("[Update User] Error :", error.toString());
    res.status(500).json({
      code: 500,
      message: "Internal Server Error"
    });
  };
};

const getHighestVal = (arr) => {
  return Math.max(...arr);
}
/**
 * @Group - Manajemen Dashboard
 * @Method - GET
 * @address - /download/report/log
 * @Function - Get Log barang as xlsx
 */
 exports.getLogsAsXslx = async (req, res) => {
  const { start_date, end_date } = req.query;
  let cleanData = [];
  try {
    const getSql = `
    SELECT v.*, c.name AS category,
      (SELECT JSON_ARRAYAGG(JSON_OBJECT("id", a.id, "product_id", a.product_id, "initial_value", a.initial_value, "final_value", a.final_value, "activity_id", a.activity_id, "created_at", a.created_at))
      FROM activity_log a
      WHERE a.product_id = v.id AND a.activity_id IN(1,2) AND a.created_at BETWEEN ? AND ?
      ORDER BY a.created_at ASC) AS activity
    FROM variants v
    INNER JOIN category c ON v.category_id = c.id
    GROUP BY v.id
    ORDER BY v.category_id ASC`;

    const sqlData = await execute(pusacho, getSql, [`${start_date} 00:00:00`, `${end_date} 23:59:59`]);

    if (sqlData.length > 0) {
      sqlData.forEach(item => {
        item.activity = JSON.parse(item.activity);
        let itemAcObjs = [];
        let totalTambah = 0, totalKurang = 0;
        if(item.activity !== null){
          item.activity.forEach(itemA => {
            let asObj = JSON.parse(itemA);
            if(item.id === asObj.product_id){
              if(asObj.activity_id === 1){
                let total = asObj.final_value - asObj.initial_value;
                totalTambah += total;
              }
              else if (asObj.activity_id === 2){
                let total = asObj.initial_value - asObj.final_value;
                totalKurang += total;
              }
              itemAcObjs.push(asObj);
            }
          });
        }
        
        item.activity = itemAcObjs;
        item.QtyMasuk = totalTambah;
        item.QtyKeluar = totalKurang;
        item.QtyAwal = item.activity.length > 0 ? Number(item.activity[0].initial_value)  : item.stock;
        item.QtyTotal = item.stock;
        let cleanDatum = {
          "Kode Barang": item.id,
          "Nama": item.name,
          "Kategori": item.category,
          "Ukuran": item.size,
          "Harga Modal (Rp)": Number(getHighestVal(item.modals.split("|"))),
          "Harga Modal Nett (Rp)": Number(getHighestVal(item.modal_nett.split("|"))),
          "Biaya Logistik (Rp)": Number(getHighestVal(item.logistic_costs.split("|"))),
          "Harga Jual (Rp)": Number(item.price),
          "Margin (%)": Number(getHighestVal(item.margins.split("|"))),
          "Qty Awal": item.QtyAwal,
          "Qty Masuk": item.QtyMasuk,
          "Qty Keluar": item.QtyKeluar,
          "Qty Total": item.QtyTotal
        };
        cleanData.push(cleanDatum);
      });
    } else {
      let cleanDatum = {
        "Kode Barang": "",
        "Nama": "",
        "Kategori": "",
        "Ukuran": "",
        "Harga Modal (Rp)": "",
        "Harga Modal Nett (Rp)": "",
        "Biaya Logistik (Rp)": "",
        "Harga Jual (Rp)": "",
        "Margin (%)": "",
        "Qty Awal": "",
        "Qty Masuk": "",
        "Qty Keluar": "",
        "Qty Total": ""
      };
      cleanData.push(cleanDatum);
    }
    const attachmentDate = moment(new Date()).format("DD-MM-YYYY");
    const fileName = `products-download-${attachmentDate}.xlsx`;

    const xls = json2xls(cleanData);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats');
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    res.end(xls, "binary");

  } catch (error) {
    console.log("[Get Log Barang as Xlsx] Error: ", error.toString())
    res.status(500).json({
      status: 500,
      message: `Internal Server Error: ${error.toString()}`,
    });
  }
};

/**
 * @Group - Manajemen Dashboard
 * @Method - GET
 * @address - /download/report/log
 * @Function - Get Log barang as xlsx
 */
 exports.getActivitiesAsXslx = async (req, res) => {
  const { start_date, end_date } = req.query;
  let cleanData = [];
  try {
    const getSql = `
    SELECT v.id AS id, v.name, v.size, c.name AS category,
      (SELECT JSON_ARRAYAGG(JSON_OBJECT("id", a.id, "product_id", a.product_id, "initial_value", a.initial_value, "final_value", a.final_value, "activity_id", 
        a.activity_id, "description", t.description, "actor", u.name, "created_at", a.created_at))
      FROM activity_log a
      INNER JOIN activities t ON a.activity_id = t.id
      INNER JOIN users u ON a.actor_id = u.id
      WHERE a.product_id = v.id AND NOT a.activity_id = 1 AND NOT a.activity_id = 2 AND a.created_at BETWEEN ? AND ?
      ORDER BY a.created_at ASC) AS activity
    FROM variants v
    INNER JOIN category c ON v.category_id = c.id
    GROUP BY v.id
    ORDER BY v.category_id ASC`;

    const sqlData = await execute(pusacho, getSql, [`${start_date} 00:00:00`, `${end_date} 23:59:59`]);

    if (sqlData.length > 0) {
      sqlData.forEach(item => {
        item.activity = JSON.parse(item.activity);
        let itemAcObjs = [];
        if(item.activity !== null){
          item.activity.forEach(itemA => {
            let asObj = JSON.parse(itemA);
            itemAcObjs.push(asObj);
          })
        }
        item.activity = itemAcObjs;
        let cleanDatum = {
          "Kode Barang": item.id,
          "Nama": item.name,
          "Kategori": item.category,
          "Ukuran": item.size,
          "Jenis Aktivitas": item.activity.length > 0 ? item.activity[0].product_id === item.id ? item.activity[0].description : "" : "",
          "Awal": item.activity.length > 0 ? item.activity[0].product_id === item.id ? item.activity[0].initial_value : "" : "",
          "Hasil": item.activity.length > 0 ? item.activity[0].product_id === item.id ? item.activity[0].final_value : "" : "",
          "Aktor": item.activity.length > 0 ? item.activity[0].product_id === item.id ? item.activity[0].actor : "" : "",
          "Tanggal": item.activity.length > 0 ? item.activity[0].product_id === item.id ? moment(item.activity[0].created_at).format("DD/MM/YYYY HH:mm:ss") : "" : "",
        };
        cleanData.push(cleanDatum);
        if(item.activity.length > 0 ){
          if(item.activity[0].product_id === item.id){
            item.activity.forEach((itemA, index) => {
              if(index !== 0){
                let activDatum = {
                  "Kode Barang": "",
                  "Nama": "",
                  "Kategori": "",
                  "Ukuran": "",
                  "Jenis Aktivitas": itemA.description,
                  "Awal": itemA.initial_value,
                  "Hasil": itemA.final_value,
                  "Aktor": itemA.actor,
                  "Tanggal": moment(itemA.created_at).format("DD/MM/YYYY HH:mm:ss")
                };
                cleanData.push(activDatum);
              }
            });
          }
        }
      });
    } else {
      let cleanDatum = {
        "Kode Barang": "",
        "Nama": "",
        "Kategori": "",
        "Ukuran": "",
        "Jenis Aktivitas": "",
        "Awal": "",
        "Hasil": "",
        "Aktor": "",
        "Tanggal": ""
      };
      cleanData.push(cleanDatum);
    }
    const attachmentDate = moment(new Date()).format("DD-MM-YYYY");
    const fileName = `products-download-${attachmentDate}.xlsx`;

    const xls = json2xls(cleanData);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats');
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    res.end(xls, "binary");

  } catch (error) {
    console.log("[Get Log Barang as Xlsx] Error: ", error.toString())
    res.status(500).json({
      status: 500,
      message: `Internal Server Error: ${error.toString()}`,
    });
  }
};

// Produk Manajemen

/**
 * Get ALl Categories
 * {GET}/manajemen/categories
 */
exports.getAllCategories = async (req, res) => {
  try {
    const sql = "SELECT id AS value, name AS label FROM category";

    const categories = await execute(pusacho, sql);
    if (categories.length > 0) {
      res.status(200).json({
        code: 200,
        message: "Ok",
        data: categories
      });
    } else {
      res.status(204).json({
        code: 204,
        message: "No Categories Found"
      })
    };
  } catch(error) {
    console.log("[Get All Categories] Error: ", error.toString());
    res.status(500).json({
      code: 500,
      message: "Internal Server Error"
    });
  }
};

/**
 * Add New Category
 * {GET}/manajemen/categories/add
 */
exports.addNewCategory = async (req, res) => {
  const { category } = req.body;

  try {
    const sql = "INSERT INTO category (name) VALUES (?)";
    const insertCategory = await execute(pusacho, sql, category);
    if (insertCategory.affectedRows > 0) {
      res.status(200).json({
        code: 200,
        message: "Added new category successfully"
      })
    } else {
      res.status(400).json({
        code: 400,
        message: "Failed to add new category."
      })
    };
  } catch(error) {
    console.log("[Add New Category] Error: ", error.toString());
    res.status(500).json({
      code: 500,
      message: "Internal Server Error"
    })
  };
}

/**
 * Get ALl Products
 * {GET}/manajemen/products
 */
exports.getAllProducts = async (req, res) => {
  const { sort, filter, query, offset, limit } = req.query;
  const offsetInt = _.isUndefined(offset) ? 0 : parseInt(offset);
  const limitInt = _.isUndefined(limit) ? 10 : parseInt(limit);
  const limitoffset = `LIMIT ${offsetInt}, ${limitInt}`;

  try {
    const filqueryValues = []

    let where_sql = "";
    if (filter) {
      where_sql += `WHERE c.id IN (${filter})`;
    };
    if (query) {
      where_sql += filter != "" ? " AND LOWER(v.name) LIKE LOWER(?)" : "WHERE LOWER(v.name) LIKE LOWER(?)";
      filqueryValues.push(`%${query}%`);
    }; 

    const where_sort = 
      sort == "modalasc" ? "ORDER BY CONVERT(SUBSTRING_INDEX(modals, ',', -1), SIGNED) ASC" :
      sort == "modaldesc" ? "ORDER BY CONVERT(SUBSTRING_INDEX(modals, ',', -1), SIGNED) DESC" :
      sort == "amountasc" ? "ORDER BY stock ASC" :
      sort == "amountdesc" ? "ORDER BY stock DESC" :
      sort == "sellasc" ? "ORDER BY price ASC" :
      sort == "selldesc" ? "ORDER BY price DESC" : "";

    const sql = `
      SELECT 
        c.name AS category_name, 
        v.id, 
        v.name,  
        v.size, 
        v.price, 
        v.stock, 
        v.suppliers, 
        v.modals, 
        v.modal_nett_per, 
        v.modal_nett, 
        v.logistic_costs, 
        v.margins,
        v.images
      FROM variants v 
      INNER JOIN category c ON v.category_id = c.id 
      ${where_sql}
      ${where_sort}
      ${limitoffset}
    `;

    const sqlTotal = `
      SELECT COUNT(v.id) as total
      FROM variants v 
      INNER JOIN category c ON v.category_id = c.id 
      ${where_sql}
      ${where_sort}
    `;

    const product = await execute(pusacho, sql, filqueryValues);
    const [productTotal] = await execute(pusacho, sqlTotal, filqueryValues);
    
    if (product.length > 0) {
      product.map(item => {
        item.suppliers = item.suppliers.split("|");
        item.modals = item.modals.split("|");
        item.modal_nett_per = item.modal_nett_per.split("|");
        item.modal_nett = item.modal_nett.split("|");
        item.logistic_costs = item.logistic_costs.split("|");
        item.margins = item.margins.split("|");
      });

      res.status(200).json({
        code: 200,
        message: "Ok",
        data: product,
        meta: {
          total: productTotal.total
        }
      })
    } else {
      res.status(200).json({
        code: 204,
        message: "No Product",
        data: [],
        meta: {
          total: 0
        }
      })
    }
  } catch(error) {
    console.log("[Get All Product] Error: ", error.toString());
    res.status(500).json({
      code: 500,
      message: "Internal Server Error"
    });
  };
};


/**
 * Get Single Product by PID
 * {GET}/manajemen/products/:pid
 */
exports.getSingleProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const sql = `
    SELECT 
      c.id AS category_id,
      c.name AS category_name,
      v.id,
      v.name, 
      v.size,
      v.price,
      v.stock,
      v.suppliers,
      v.modals,
      v.modal_nett_per,
      v.modal_nett,
      v.logistic_costs,
      v.margins,
      v.images
    FROM variants v 
    INNER JOIN category c ON v.category_id = c.id 
    WHERE v.id = ?
    `;
    
    let product = await execute(pusacho, sql, [id]);

    if (product.length > 0) {
      product[0].suppliers = product[0].suppliers.split("|");
      product[0].modals = product[0].modals.split("|");
      product[0].modal_nett_per = product[0].modal_nett_per.split("|");
      product[0].modal_nett = product[0].modal_nett.split("|");
      product[0].logistic_costs = product[0].logistic_costs.split("|");
      product[0].margins = product[0].margins.split("|");

      res.status(200).json({
        code: 200,
        message: "Ok",
        data: product[0]
      }) 
    } else {
      res.status(204).json({
        code: 204,
        message: "No Data Found"
      });
    }

  } catch(error) {
    console.log("[Get Single Product] Error: ", error.toString());
    res.status(500).json({
      code: 500,
      message: "Internal Server Error"
    });
  }
};

// Move Image function for add & edit product
const moveImage = (files, name, id) => {
  return new Promise((resolve, reject) => {
    mv(files.path, `${__dirname}/../images/${name}`, { mkdirp: true }, async (error) => {
      if (error) reject(error)
      else {
        const imgPath = `/images/${name}`
        const updateSql = `UPDATE variants SET images = ? WHERE id = ?`;
        const updateProduct = await execute(pusacho, updateSql, [imgPath, id]);
        resolve(updateProduct);
      }
    })
  })
};

/**
 * Update Product amount 
 * {POST}/manajemen/product
 */
 exports.addProduct = async (req, res) => {
  const { id, category, name, size, price, stock, suppliers, modals, modal_nett_per, modal_nett, logistic_costs, margins } = JSON.parse(req.body.data);
  try {
   const sql = `
    INSERT INTO variants (id, category_id, name, size, price, stock, suppliers, modals, modal_nett_per, modal_nett, logistic_costs, margins)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const updateProduct = await execute(pusacho, sql, [id, category, name, size, price, stock, suppliers, modals, modal_nett_per, modal_nett, logistic_costs, margins]);
    if (updateProduct.affectedRows > 0) {

      const [categoryName] = await execute(pusacho, "SELECT name FROM category WHERE id = ?", category);
      const mvImg = await moveImage(req.files.image[0], `${categoryName.name.toLowerCase()}/${id}.${req.files.image[0].mimetype.split("/")[1]}`, id);
      if (mvImg.affectedRows == 1) {
        res.status(200).json({
          code: 200,
          message: "Ok"
        })
      }

    } else {
      res.status(400).json({
        code: 400,
        message: "Failed to update"
      })
    }

  } catch(error) {
    console.log("[Insert Product] Error :", error.toString());
    res.status(500).json({
      code: 200,
      message: "Internal Server Error"
    });
  };
};

/**
 * Update Product data 
 * {POST}/manajemen/product
 */
exports.editProduct = async (req, res) => {
  const { 
    auth,
    id, category, name, size, price, stock, suppliers, modals, modal_nett_per, modal_nett, logistic_costs, margins,
  } = JSON.parse(req.body.data);

  try {
    const origProductSql = `
      SELECT 
        c.id AS category_id,
        c.name AS category_name,
        v.id,
        v.name, 
        v.size,
        v.price,
        v.stock,
        v.suppliers,
        v.modals,
        v.modal_nett_per,
        v.modal_nett,
        v.logistic_costs,
        v.margins,
        v.images
      FROM variants v 
      INNER JOIN category c ON v.category_id = c.id 
      WHERE v.id = ?
    `;
    const [origProduct] = await execute(pusacho, origProductSql, [id]);

    const sql = `
    UPDATE variants 
    SET category_id = ?, name = ?, size = ?, price = ?, stock = ?, suppliers = ?, modals = ?, modal_nett_per = ?, modal_nett = ?, logistic_costs = ?, margins = ?
    WHERE id = ?
   `

    const updateProduct = await execute(pusacho, sql, [category, name, size, price, stock, suppliers, modals, modal_nett_per, modal_nett, logistic_costs, margins, id]);
    if (updateProduct.affectedRows > 0) {

      // Handle Image
      if (!_.isEmpty(req.files)) {
        const [categoryName] = await execute(pusacho, "SELECT name FROM category WHERE id = ?", category);
        const mvImg = await moveImage(req.files.image[0], `${categoryName.name.toLowerCase()}/${id}.${req.files.image[0].mimetype.split("/")[1]}`, id);
        if (mvImg.affectedRows == 1) {
          res.status(200).json({
            code: 200,
            message: "Ok"
          })
        }
      } 

      // Handle Update to Activity Log
      const changedData = [];
      if (origProduct.stock != stock) stock > origProduct.stock ? changedData.push([1, id, origProduct.stock, stock, auth]) : changedData.push([2, id, origProduct.stock, stock, auth]);
      if (origProduct.name != name) changedData.push([3, id, origProduct.name, name, auth]);
      if (origProduct.price != price) changedData.push([4, id, origProduct.price, price, auth]);
      if (origProduct.modals != modals) changedData.push([5, id, origProduct.modals, modals, auth]);
      if (origProduct.modal_nett != modal_nett) changedData.push([6, id, origProduct.modal_nett, modal_nett, auth]);
      if (origProduct.margins != margins) changedData.push([7, id, origProduct.margins, margins, auth]);
      if (origProduct.suppliers != suppliers) changedData.push([8, id, origProduct.suppliers, suppliers, auth]);
      if (origProduct.logistic_costs != logistic_costs) changedData.push([9, id, origProduct.logistic_costs, logistic_costs, auth]);
      if (origProduct.modal_nett_per != modal_nett_per) changedData.push([10, id, origProduct.modal_nett_per, modal_nett_per, auth]);

      console.log(changedData);

      if (changedData.length > 0) {
        const activitySql = "INSERT INTO activity_log (activity_id, product_id, initial_value, final_value, actor_id) VALUES ?"
        const insertActivity = await execute(pusacho, activitySql, [changedData]);
      }

      res.status(200).json({
        code: 200,
        message: "Ok"
      })
    } else {
      res.status(400).json({
        code: 400,
        message: "Failed to update"
      })
    }

  } catch (error) {
    console.log("[Update Product] Error :", error.toString());
    res.status(500).json({
      code: 200,
      message: "Internal Server Error"
    });
  };
};

/**
 * Add Both Product & Category
 * {POST}/manajemen/product
 */
exports.addBoth = async (req, res) => {
  const { id, category_name, name, size, price, stock, suppliers, modals, modal_nett_per, modal_nett, logistic_costs, margins } = JSON.parse(req.body.data);
  try {
    const addCategorySql = `INSERT INTO category (name) VALUES (?)`;
    const addCategory = await execute(pusacho, addCategorySql, category_name);

    if (addCategory.affectedRows > 0) {
      const sql = `
      INSERT INTO variants (id, category_id, name, size, price, stock, suppliers, modals, modal_nett_per, modal_nett, logistic_costs, margins)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
      const updateProduct = await execute(pusacho, sql, [id, addCategory.insertId, name, size, price, stock, suppliers, modals, modal_nett_per, modal_nett, logistic_costs, margins]);
      if (updateProduct.affectedRows > 0) {
  
        const mvImg = await moveImage(req.files.image[0], `${category_name.toLowerCase()}/${id}.${req.files.image[0].mimetype.split("/")[1]}`, id);
        if (mvImg.affectedRows == 1) {
          res.status(200).json({
            code: 200,
            message: "Ok"
          })
        }
  
      } else {
        res.status(400).json({
          code: 400,
          message: "Failed to update"
        })
      }
    }

  } catch (error) {
    console.log("[Insert Product] Error :", error.toString());
    res.status(500).json({
      code: 200,
      message: "Internal Server Error"
    });
  };
};

/**
 * Update Product amount 
 * {POST}/manajemen/products/:pid
 */
 exports.updateProductAmount = async (req, res) => {
  const { auth, id, amount, originalAmount } = req.body;

  try {
    const sql = `
      UPDATE variants
      SET stock = ? 
      WHERE id = ? 
      LIMIT 1
    `;

    const updateProduct = await execute(pusacho, sql, [amount, id]);
    if (updateProduct.affectedRows > 0) {

      if (amount != originalAmount) {
        const addOrDec = amount > originalAmount ? 1 : 2;
        const activitySql = "INSERT INTO activity_log (activity_id, product_id, initial_value, final_value, actor_id) VALUES (?, ?, ?, ?, ?)"
        const insertActivity = await execute(pusacho, activitySql, [addOrDec, id, originalAmount, amount, auth]);
      }

      res.status(200).json({
        code: 200,
        message: "Ok"
      })
    } else {
      res.status(400).json({
        code: 400,
        message: "Failed to update"
      })
    }

  } catch(error) {
    console.log("[Update Product Amount] Error :", error.toString());
    res.status(500).json({
      code: 200,
      message: "Internal Server Error"
    });
  };
};


/**
 * Delete Product
 * {DELETE}/manajemen/product
 */
 exports.deleteProduct = async (req, res) => {
  const { listOfIds } = req.body;

  try {
    const sql = "DELETE FROM variants WHERE id IN (?)";

    const deleteProduct = await execute(pusacho, sql, [listOfIds]);
    if (deleteProduct.affectedRows > 0) {
      res.status(200).json({
        code: 200,
        message: "Ok"
      })
    } else {
      res.status(400).json({
        code: 400,
        message: "Failed to delete"
      })
    }

  } catch(error) {
    console.log("[Delete Product] Error :", error.toString());
    res.status(500).json({
      code: 200,
      message: "Internal Server Error"
    });
  };
};
