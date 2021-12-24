const jwt = require('jsonwebtoken');

module.exports = function(req,res,next){
  const token = req.header('auth_token');
  if(!token) return res.status(401).send('Access Denied');
  const req_role = req.header('required_role');
  if(!req_role) return res.status(401).send('Access Denied');
  
  try{
    const req_role_split = req_role.split(',');
    let verified;
    req_role_split.forEach(item => {
      try {
        const token_secret = item === '0' ? process.env.TOKEN_SECRET_MANAJEMEN : item === '1' ? process.env.TOKEN_SECRET_LAPANGAN : process.env.TOKEN_SECRET_HYBRID;
        verified = jwt.verify(token, token_secret);
      } catch (error) { }
    });
    if(verified){
      req.user = verified;
      next();
    }
    else{
      res.status(400).json({
        status: 400,
        data: 'token invalid'
      })
    }
  } catch(err){
    console.log(err);
    res.status(400).json({
      status: 400,
      data: 'token invalid'
    })
  }
}