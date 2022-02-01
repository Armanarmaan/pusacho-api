const jwt = require('jsonwebtoken');

module.exports = function(req,res,next){
  const token = req.header('auth_token');
  if(!token) return res.status(401).send('Access Denied');
  const req_role = req.header('required_role');
  if(!req_role) return res.status(401).send('Access Denied');
  
  try{
    const req_role_split = req_role.split(',');
    if( req_role_split[0] === '0' ){
      try {
        const token_secret = process.env.TOKEN_SECRET_MANAJEMEN;
        let verified = jwt.verify(token, token_secret);
        req.user = verified;
        next();
      } catch (error) {
        if( req_role_split[1] === '2' ){
          try {
            const token_secret = process.env.TOKEN_SECRET_HYBRID;
            let verified = jwt.verify(token, token_secret);
            req.user = verified;
            next();
          } catch (error) {
            res.status(400).json({
              status: 400,
              data: 'token invalid'
            })
          }
        }
        else{
          res.status(400).json({
            status: 400,
            data: 'token invalid'
          })
        }
      }
    }
    else if( req_role_split[0] === '1' ){
      try {
        const token_secret = process.env.TOKEN_SECRET_LAPANGAN;
        let verified = jwt.verify(token, token_secret);
        req.user = verified;
        next();
      } catch (error) {
        if( req_role_split[1] === '2' ){
          try {
            const token_secret = process.env.TOKEN_SECRET_HYBRID;
            let verified = jwt.verify(token, token_secret);
            req.user = verified;
            next();
          } catch (error) {
            res.status(400).json({
              status: 400,
              data: 'token invalid'
            })
          }
        }
        else{
          res.status(400).json({
            status: 400,
            data: 'token invalid'
          })
        }
      }
    }
    
  } catch(err){
    console.log(err);
    res.status(400).json({
      status: 400,
      data: 'token invalid'
    })
  }
}