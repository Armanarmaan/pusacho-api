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
    
    const sql = "INSERT INTO categories VALUES(?)";
    const insertCategory = await execute(pusacho, sql, [category]);
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
  console.log(req.body);

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