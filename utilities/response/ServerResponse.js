var ServerResponse = {
    errorMsg: {
        message: "Internal Server Error",
        status: "fail",
        code: "E0044"
    },
    badRequest: {
        message: "Bad Request",
        status: "fail",
        code: "E0057"
    },
    validationDataResponse: (data,msg) => {
       
        var response = {
            cid:data,
            message: msg, //for local testing
            //message: "Validation Error", //at server uncomment this
            status: "fail",
            code: "E0021"
        }
        return response;
    },
    validationResponse: (msg) => {
       
        var response = {
            message: msg, //for local testing
            //message: "Validation Error", //at server uncomment this
            status: "fail",
            code: "E0021"
        }
        return response;
    },
    fraudDetectionResponse: (msg,data) => {
       
        var response = {
            message: msg, //for local testing
            data:data,
            //message: "Validation Error", //at server uncomment this
            status: "fail",
            code: "E0021"
        }
        return response;
    },
    errormsg: (msg,code="E0044", body, todays, total) => {
        msg = msg.toString();
        //msg = msg.replaceAll('\"',"");
        var response = {
            message: msg, 
            today_collection : todays,
            overall_collection: total,
            //for local testing
            //message: "Internal Server Error", //at server uncomment this
            status: "fail",
            code: code,
            reason: body,
        }
        return response;
    },
    errorMsgWithData: (msg,data,code) => {
        var response = {
            message: msg,
            status: "fail",
            code: code
        }
        if(data){
            response.data=data
        }
        return response;
    },
    
    successdatamsg: (data, msg='success',record_count=null) => {
        Object.keys(data).forEach(function(key) {
            if(data[key] === null) {
                data[key] = '';
            }
        })
        var response = {
            data: data,
            message: msg,
            status: "success",
            code: "00"
        }
        if(record_count != null){response.total_records = record_count}
        return response;
    },
    successansmsg: (data,msg='Success') => {
       
        var response = {
            data:data,
            message: msg,
            status: "success",
            code: "00"
        }
        
        return response;
    },
    successmsg: (msg='Success') => {
       
        var response = {
         
            message: msg,
            status: "success",
            code: "00"
        }
        
        return response;
    },
    
    successmsgwithsummary: (data,summary, msg='success') => {
        var response = {
            data: {
                summary:summary,
                list:data
            },
            message: msg,
            status: "success",
            code: "00"
        }
        return response;
    },
    emailalereadyused: (email) => {
        var response = {
            message: 'email ' + email + ' is taken by someone, please enter other email',
            status: "fail",
            code: "E0058"
        }
        return response;
    },
    mobilealereadyused: (mobile_no) => {
        var response = {
            message: 'Mobile no ' + mobile_no + ' is taken by someone, please enter other mobile no',
            status: "fail",
            code: "E0058"
        }
        return response;
    },
    AlreadyExist: (t) => {
        var response = {
            message: 'Record ' + t + ' is already exist',
            status: "fail",
            code: "E0058"
        }
        return response;
    },
    loginSuccess: (data) => {
        var response = {
            
            message: "Verified Successfully",
            data: data,
            status: "success",
            code: "00"
        }
        return response;
    },
    verifyEmail: (data) => {
        var response = {
            
            message: "OTP sent, Please Verify your mail",
            status: "success",
            code: "00"
        }
        return response;
    },
    verifyMobile: (data) => {
        var response = {
            message: "OTP sent on your mobile number",
            status: "success",
            code: "00"
        }
        return response;
    },
    SentOTPMobile: (data) => {
        var response = {
            message: "Otp sent on your mobile number",
            data: data,
            status: "success",
            code: "00"
        }
        return response;
    },
    generateOtp: (data) => {
        var resposne = {
            
            message: "OTP Generated Successfully",
            data: data,
            status: "success",
            code: "00"
        }
        return resposne;
    },
    success_linkmsg: (data, link, msg='success',record_count=null) => {

        Object.keys(data).forEach(function(key) {

            if(data[key] === null) {

                data[key] = '';

            }

        })

        var response = {

            data: data,

            link: link,

            message: msg,

            status: "success",

            code: "00"

        }

        if(record_count != null){response.total_records = record_count}

        return response;

    },
}
module.exports = ServerResponse;