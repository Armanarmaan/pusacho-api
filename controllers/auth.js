const { execute, pusacho } = require('../conn/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.registerUser = async (req, res) => {
  const { username, password, name, role } = req.body;

  // Check if the user is already on the database
  const queryCheckUsername = 'SELECT * from users WHERE username = ?';
  const usernameExist = await execute(pusacho, queryCheckUsername, username);
  if (usernameExist.length > 0) return res.status(400).send('Username already exists');

  // Hash Passwords
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Query insert user a new user
  const queryInsert = 'INSERT INTO `users`(`name`, `role`, `username`, `password`) VALUES (?,?,?,?)';

  try{
    const registerUser = await execute(pusacho, queryInsert, [name, role, username, hashedPassword]);
    res.json({
      status: 200,
      data: "Success"
    });
  } catch(err){
    res.json({
      status: 500,
      message: err
    });
  }
}

exports.loginUser = async (req, res) => {
  const { username, password } = req.body;
  try{
    // Check if the email is registered
    const checkUsername = 'SELECT * FROM users WHERE username = ?';
    const user = await execute(pusacho, checkUsername, username);
    if (user.length < 1) {
      res.json({
        status: 400,
        message: "user does not exist"
      });
      return;
    }

    // Check if password is correct
    const validPass = await bcrypt.compare(password, user[0].password);
    if (!validPass) {
      res.json({
        status: 400,
        message: "user does not exist"
      });
      return;
    }

    // Create token Based on User Role
    const token_secret = user[0].role === 0 ? process.env.TOKEN_SECRET_MANAJEMEN : user[0].role === 1 ? process.env.TOKEN_SECRET_LAPANGAN : process.env.TOKEN_SECRET_HYBRID;
    const token = jwt.sign({ _id: user[0].name }, token_secret);
    
    // Return token, username and role
    res.json({
      status: 200,
      auth_token: token,
      username:  user[0].username,
      role: user[0].role,
      id: user[0].id
    });
  } catch(err){
    res.json({
      status: 500,
      message: err
    });
  }
}

exports.verifyUser = async (req, res) => {
  res.json({
    status: 200,
    data: 'token valid'
  })
}

exports.changePassword = async (req, res) => {
  const { id, password } = req.body;
  // Hash Passwords
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Query insert user a new user
  const queryInsert = 'UPDATE users SET password = ? WHERE id = ?';

  try{
    const updatePasswordUser = await execute(pusacho, queryInsert, [hashedPassword, id]);
    if (updatePasswordUser.affectedRows > 0) {
      res.json({
        status: 200,
        data: "Success"
      });
    }
    else{
      res.json({
        status: 500,
        message: err
      });
    }
  } catch(err){
    res.json({
      status: 500,
      message: err
    });
  }
}