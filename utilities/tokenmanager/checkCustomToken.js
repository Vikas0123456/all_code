const jwt = require('jsonwebtoken');

module.exports =  async (req_token) => {
    const token = req_token;
    // let res = {status:"Fail",message:'',data:{}}
    if (token == null) {
        return {status:"Fail",message:'Invalid access'};
    } else {
        let res = {status:"Fail",message:'Unauthorized request',data:{}}
        try{
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET,   (err, user) => {
                if (err) {
                    
                    if (err.message == "jwt expired") {
                        res.message='Link Expired'
                    } else {
                        res.message='Unable to validate data'
                    }
                } else {
                   res.data = user
                   res.status = "Success"
                   res.message = "Success"
                }
            });
            return res;
        } catch(error){
            
            console.log(error)
            return res
        }
    }
}