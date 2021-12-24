const { execute, pusacho } = require('../conn/db');
const moment = require('moment');
const _ = require('lodash');

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
  const { activeTab } = req.query;
  try{
    const queryGetData = activeTab === '0' ? 
      `SELECT l.id, l.product_id, v.name, v.price, a.wording, l.activity_id, 
          l.initial_value, l.final_value, l.actor_id, u.name AS actor_name, l.created_at
        FROM activity_log l 
        INNER JOIN activities a ON l.activity_id = a.id 
        INNER JOIN variants v ON l.product_id = v.id
        INNER JOIN users u ON l.actor_id = u.id
        WHERE l.activity_id IN(1,2)
        ORDER BY l.created_at DESC;`
      :
      `SELECT l.id, l.product_id, v.name, v.price, a.wording, l.activity_id, 
          l.initial_value, l.final_value, l.actor_id, u.name AS actor_name, l.created_at
        FROM activity_log l 
        INNER JOIN activities a ON l.activity_id = a.id 
        INNER JOIN variants v ON l.product_id = v.id
        INNER JOIN users u ON l.actor_id = u.id
        WHERE NOT l.activity_id = 1 AND NOT l.activity_id = 2
        ORDER BY l.created_at DESC;`;
    
    const data = await execute(pusacho, queryGetData);
    let dataProcessed;
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

      dataProcessed = groupedResArr
    }
    else{
      dataProcessed = data;
    }
    res.json({
      status: 200,
      data: dataProcessed
    });
  } catch(err){
    console.log(err);
    res.json({
      status: 500,
      message: err
    });
  }
}