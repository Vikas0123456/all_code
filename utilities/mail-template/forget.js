module.exports = function(data,logo,title){
    return `
    <html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head>
    <meta charset="utf-8">
    <meta name="x-apple-disable-message-reformatting">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
    <!--[if mso]>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
    <style>
      td,th,div,p,a,h1,h2,h3,h4,h5,h6 {font-family: "Segoe UI", sans-serif; mso-line-height-rule: exactly;}
    </style>
  <![endif]-->
    <title>`+title+`</title>
    <link href="https://fonts.googleapis.com/css?family=Montserrat:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,200;1,300;1,400;1,500;1,600;1,700" rel="stylesheet" media="screen">
    <style>
      .hover-underline:hover {
        text-decoration: underline !important;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes ping {

        75%,
        100% {
          transform: scale(2);
          opacity: 0;
        }
      }

      @keyframes pulse {
        50% {
          opacity: .5;
        }
      }

      @keyframes bounce {

        0%,
        100% {
          transform: translateY(-25%);
          animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
        }

        50% {
          transform: none;
          animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
        }
      }

      @media (max-width: 600px) {
        .sm-leading-32 {
          line-height: 32px !important;
        }

        .sm-px-24 {
          padding-left: 24px !important;
          padding-right: 24px !important;
        }

        .sm-py-32 {
          padding-top: 32px !important;
          padding-bottom: 32px !important;
        }

        .sm-w-full {
          width: 100% !important;
        }
      }
    </style>
  </head>

  <body style="margin: 0; padding: 0; width: 100%; word-break: break-word; -webkit-font-smoothing: antialiased; --bg-opacity: 1; background-color: #eceff1; background-color: rgba(236, 239, 241, var(--bg-opacity));">
  <div style="margin:0;padding:0">
  <table style="border-collapse:collapse;table-layout:fixed;margin:0 auto;border-spacing:0;padding:0;height:100%!important;width:100%!important;font-weight:normal;color:#3e4152;font-family:'roboto',Arial,Helvetica,sans-serif;font-size:14px;line-height:1.4" height="100%" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tbody>
          <tr>
              <td style="background:#ffffff;padding:16px 0">
                  <table style="max-width:600px;margin:auto;border-spacing:0;background:#056e4e;padding:4px;border-radius:16px;overflow:hidden" align="center" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tbody>
                          <tr>
                              <td style="border-collapse:collapse">
                                  <table style="margin:auto;border-spacing:0;background:white;border-radius:12px;overflow:hidden" align="center" border="0" cellpadding="0" cellspacing="0" width="100%">
                                      <tbody>
                                          <tr>
                                              <td style="border-collapse:collapse">
                                                  <table style="border-spacing:0;border-collapse:collapse" bgcolor="#ffffff" border="0" cellpadding="0" cellspacing="0" width="100%">
                                                      <tbody>
                                                          <tr>
                                                              <td style="border-collapse:collapse;padding:16px 32px" align="left" valign="middle">
                                                                  <table style="border-spacing:0;border-collapse:collapse" bgcolor="#ffffff" border="0" cellpadding="0" cellspacing="0" width="100%">
                                                                      <tbody>
                                                                          <tr>
                                                                              <td style="padding:0;text-align:left;border-collapse:collapse" width="40" align="left" valign="middle">
                                                                                  <a href="https://www.Telr.com" style="text-decoration:none;color:#ffffff;outline:0;outline:none;border:0;border:none" target="_blank"><img src="${logo}" title="Telr" alt="Telr" style="margin:auto;text-align:center;border:0;outline:none;text-decoration:none;height:40px" align="middle" border="0" class="CToWUd" data-bit="iit"></a>
                                                                              </td>
                                                                              <td width="16" align="left" valign="middle" style="border-collapse:collapse">&nbsp;
                                                                              </td>
                                                                              <td align="right" valign="middle"> </td>
                                                                          </tr>
                                                                      </tbody>
                                                                  </table>
                                                              </td>
                                                          </tr>
                                                      </tbody>
                                                  </table>
                                              </td>
                                          </tr>
                                          <tr>
                                              <td style="border-collapse:collapse;padding:0 16px">
                                                  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#f7f9fa;padding:16px;border-radius:8px;margin-top:30px;overflow:hidden">
                                                      <tbody>
                                                          <tr>
                                                              <td align="left" valign="middle" style="border-collapse:collapse;padding-bottom:16px;border-bottom:1px solid #eaeaed">
                                                                  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%">
                                                                      <tbody>
                                                                          <tr>
                                                                              <td align="left" valign="top" style="border-collapse:collapse;<b>TELR0900091</b>"><span style="border-collapse:collapse;width:100%;display:block; font-weight: bolder;">Password Reset </span><span style="border-collapse:collapse;font-size:16px;font-weight:500;width:100%;display:block"></span></td>
                                                                              <td width="32" align="left" valign="middle" style="border-collapse:collapse"></td>
                                                                              <td align="right" valign="middle" style="border-collapse:collapse;font-size:20px;font-weight:500"></td>
                                                                          </tr>
                                                                      </tbody>
                                                                  </table>
                                                              </td>
                                                          </tr>
                                                          <tr>
                                                              <td align="left" valign="middle" style="border-collapse:collapse;padding:8px 0;border-bottom:1px solid #eaeaed;font-size:12px">
                                                                  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%">
                                                                      <tbody>
                                                                          <tr>
                                                                              <td width="100%" align="left" valign="top" style="border-collapse:collapse;">Dear ${data.user_name},
                                                                                  <br><br>The <b style="color: #056e4e;">Telr account</b> associated to ${data.mail} received a request to reset the password, simply click on the button below: </td>
                                                                          </tr>
                                                                      </tbody>
                                                                  </table>
                                                              </td>
                                                          </tr>
                                                          <tr>
                                                              <td align="left" valign="middle" style="border-collapse:collapse;padding:5px 8px 10px;font-size:12px">
                                                                  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%">
                                                                      <tbody>
                                                                          <tr>
                                                                              <td width="100%" align="middle" valign="top" style="border-collapse:collapse;<b>TELR0900091</b>; padding: 10px;"><a href="${data.url}"><button style="background-color: #056e4e;padding: 10px;border-radius: 10px;color: white;width: 80% !important;font-size: 20px;border: 0;">Reset Password</button></a></td>
                                                                          </tr>
                                                                      </tbody>
                                                                  </table>
                                                              </td>
                                                          </tr>
                                                          <tr>
                                                              <td align="left" valign="middle" style="border-collapse:collapse;padding:8px 0px;font-size:12px">
                                                                  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%">
                                                                      <tbody>
                                                                          <tr>
                                                                              <td width="100%" align="middle" valign="top" style="border-collapse:collapse;<b>TELR0900091</b>; "><small>Please contact us immediately,
if you did not request a password reset.</small><br><br><small>Do you have issues logging in? Visit <a style="color: #056e4e;" href="https://telr.com/contact-us/">Telr Support</a></small></td>
                                                                          </tr>
                                                                      </tbody>
                                                                  </table>
                                                              </td>
                                                          </tr>
                                                      </tbody>
                                                  </table>
                                              </td>
                                          </tr>
                                          <tr>
                                              <td style="border-collapse:collapse;padding:16px 32px; font-family:'roboto',Arial,Helvetica,sans-serif;font-size:12px">
                                                  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%">
                                                      <tbody>
                                                          <tr>
                                                              <td align="middle" valign="middle" style="border-collapse:collapse;font-weight:normal"><b style="color: #056e4e;">Telr</b>, Dubai Digital Park, Dubai, UAE <br><small>Learn more about Telr's <a href="https://telr.com/sa-en/legal/privacy-policy/" style="color: #056e4e;text-decoration: none;">security and privacy policy</a>,
and our <a href="https://telr.com/sa-en/resources/getting-started/onboarding/" style="color: #056e4e;text-decoration: none; ">verification process.</a></small></td>
                                                          </tr>
                                                      </tbody>
                                                  </table>
                                              </td>
                                          </tr>
                                      </tbody>
                                  </table>
                              </td>
                          </tr>
                      </tbody>
                  </table>
              </td>
          </tr>
      </tbody>
  </table>
  
  
  
  
  <p>&nbsp;
      <br></p>
</div>

</body>
</html>`
}