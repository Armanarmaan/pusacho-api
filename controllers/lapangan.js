const { execute, pusacho } = require('../conn/db');
const moment = require('moment');
const _ = require('lodash');

exports.getSomething = (req, res) => {
  const { dataA, dataB } = req.body;
  console.log(req.body)
  try {

    const data = {
      data: {
        result: Number(dataA) + Number(dataB)
      }
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

exports.getProdukbyID = async (req, res) => {
  const { id } = req.query;

  try {

    const queryGetProduk = 'SELECT * from variants WHERE id = ?';
    const produk = await execute(pusacho, queryGetProduk, id);
    // console.log(produk);

    res.status(200).json({
      code: 200,
      message: "Ok",
      data: produk
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: "Failed",
      data: `Error while getting product detail: ${error}`
    })
  }
}

exports.getAktivitas = async (req, res) => {
  const { id } = req.query;
  try {
    const queryGetData =
      `SELECT l.id, l.product_id, v.name, a.wording, l.activity_id, 
            l.initial_value, l.final_value, l.created_at
          FROM activity_log l 
          INNER JOIN activities a ON l.activity_id = a.id 
          INNER JOIN variants v ON l.product_id = v.id
          INNER JOIN users u ON l.actor_id = u.id
          WHERE u.id = ? AND l.activity_id = 1 OR l.activity_id = 2
          ORDER BY l.created_at DESC;`;

    const data = await execute(pusacho, queryGetData, id);
    let dataProcessed;
    data.forEach(item => {
      item.date = moment(item.created_at).format("YYYY-MM-DD");
      if(item.activity_id === 1){
        item.difference = item.final_value - item.initial_value;
      }
      else if(item.activity_id === 2){
        item.difference = item.initial_value - item.final_value;
      }
    });
    let groupedResultObj = _.mapValues(_.groupBy(data, 'date'),
      clist => clist.map(date => _.omit(date, 'date')));
    let groupedResArr = [];
    Object.entries(groupedResultObj).forEach(itemzz => {
      groupedResArr.push(itemzz[1]);
    });
    

    dataProcessed = groupedResArr

    res.json({
      status: 200,
      data: dataProcessed
    });
  } catch (err) {
    console.log(err);
    res.json({
      status: 500,
      message: err
    });
  }
}

exports.postPengurangan = async (req, res) => {
  const { id, jumlah, actorID } = req.query;
  try {
    const queryGetProduk = 'SELECT stock from variants WHERE id = ?';
    const produk = await execute(pusacho, queryGetProduk, id);
    
    const currentProduk = produk[0].stock;

    const jumlahAkhir = currentProduk - jumlah;

    const queryUpdateProduk = 'UPDATE variants SET stock = ? WHERE id = ?';

    const update = await execute(pusacho, queryUpdateProduk, [jumlahAkhir, id]);

    const queryActivityLog = 'INSERT INTO activity_log (activity_id, product_id, initial_value, final_value, actor_id) VALUES (?,?,?,?,?)';

    const activiy = await execute(pusacho, queryActivityLog, [2, id, currentProduk, jumlahAkhir, actorID]);

    res.status(200).json({
      code: 200,
      message: "Ok"
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: "Failed",
      data: `Error while getting product detail: ${error}`
    })
  }
}