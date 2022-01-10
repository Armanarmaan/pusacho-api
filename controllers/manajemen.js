const { execute, pusacho } = require("../conn/db");
const moment = require("moment");
const _ = require("lodash");

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
  const { activeTab, keyword, categories, datestart, dateend } = req.query;
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
          l.initial_value, l.final_value, l.actor_id, u.name AS actor_name, l.created_at
        FROM activity_log l 
        INNER JOIN activities a ON l.activity_id = a.id 
        INNER JOIN variants v ON l.product_id = v.id
        INNER JOIN users u ON l.actor_id = u.id
        WHERE l.activity_id IN(1,2) AND ${allWheres}
        ORDER BY l.created_at DESC;`
      :
      `SELECT l.id, l.product_id, v.name, v.price, a.wording, l.activity_id, 
          l.initial_value, l.final_value, l.actor_id, u.name AS actor_name, l.created_at
        FROM activity_log l 
        INNER JOIN activities a ON l.activity_id = a.id 
        INNER JOIN variants v ON l.product_id = v.id
        INNER JOIN users u ON l.actor_id = u.id
        WHERE NOT l.activity_id = 1 AND NOT l.activity_id = 2 AND ${allWheres}
        ORDER BY l.created_at DESC;`;
    const data = await execute(pusacho, queryGetData);

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
                  item.initial_value = arrInitial.join("; ");
                  item.final_value = arrFinal.join("; ");
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
          itemzzz.reverse();
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
        data: dataProcessed
      });
    }
    else{
      let dataProcessed = {
        datas: [],
        categories: categoryList
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
  const { sort, filter, query } = req.query;

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
      SELECT c.name AS category_name, v.id, v.name,  v.size, v.price, v.stock, v.suppliers, v.modals, v.modal_nett_per, v.modal_nett, v.logistic_costs, v.margins
      FROM variants v 
      INNER JOIN category c ON v.category_id = c.id 
      ${where_sql}
      ${where_sort}
    `;

    const product = await execute(pusacho, sql, filqueryValues);
    
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
        data: product
      })
    } else {
      res.status(200).json({
        code: 204,
        message: "No Product",
        data: []
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
      v.margins
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

/**
 * Update Product amount 
 * {POST}/manajemen/products/:pid
 */
 exports.updateProductAmount = async (req, res) => {
  const { id, amount } = req.body;

  try {
    const sql = `
      UPDATE variants
      SET stock = ? 
      WHERE id = ? 
      LIMIT 1
    `;

    const updateProduct = await execute(pusacho, sql, [amount, id]);
    console.log(updateProduct);
    if (updateProduct.affectedRows > 0) {
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
