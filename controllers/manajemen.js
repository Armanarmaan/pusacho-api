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
    const sql = "SELECT * FROM categories";

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
exports.getAllProducts = (req, res) => {
  // const { }
};


/**
 * Get Single Product by PID
 * {GET}/manajemen/products/:pid
 */
exports.getSingleProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const sql = `SELECT * FROM variants WHERE id = ?`;
    
    const product = await execute(pusacho, sql, [id]);
    if (product.length > 0) {
      res.status(200).json({
        code: 200,
        message: "Ok",
        data: product
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