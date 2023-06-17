let serverResponse = {
  successMessage: (msg = 'success') => {
    let response = {
      message: msg,
      status: 'success',
      code: '00',
    };
    return response;
  },

  errorMessage: (msg, code = 'E0044', body) => {
    msg = msg.toString();
    let response = {
      message: msg,
      status: 'fail',
      code: code,
      reason: body,
    };
    return response;
  },

  successDataMessage: (data, msg = 'success', record_count = null) => {
    Object.keys(data).forEach((key) => {
      if (data[key] == null) {
        data[key] = '';
      }
    });
    let response = {
      data: data,
      message: msg,
      status: 'success',
      code: '00',
    };
    if (record_count != null) {
      response.total_records = record_count;
    }
    return response;
  },
  AlreadyExist: (t) => {
    var response = {
      message: 'Record ' + t + ' is already exist',
      status: 'fail',
      code: 'E0058',
    };
    return response;
  },
  loginSuccess: (data) => {
    var response = {
      message: 'Login Successfully',
      data: data,
      status: 'success',
      code: '00',
    };
    return response;
  },
  validationResponse: (msg) => {
    var response = {
      message: msg, //for local testing
      //message: "Validation Error", //at server uncomment this
      status: 'fail',
      code: 'E0021',
    };
    return response;
  },
  loginSuccess: (data) => {
    var response = {
      message: 'Logged in Successfully',
      token: data,
      status: 'success',
      code: '00',
    };
    return response;
  },
};

module.exports = serverResponse;
