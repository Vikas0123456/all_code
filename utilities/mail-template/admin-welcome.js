module.exports = function(data,logo,title){
    return `<div class="email_div">
    <div style="margin:0;padding:0">
        <table style="border-collapse:collapse;table-layout:fixed;margin:0 auto;border-spacing:0;padding:0;height:100%!important;width:100%!important;font-weight:normal;color:#3e4152;font-family:'roboto',Arial,Helvetica,sans-serif;font-size:14px;line-height:1.4" height="100%" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tbody>
                <tr>
                    <td style="background:#ffffff;padding:16px 0">
                        <table style="max-width:600px;margin:auto;border-spacing:0;background:#056e4e;padding:4px;border-radius:16px;overflow:hidden; " align="center" border="0" cellpadding="0" cellspacing="0" width="100%">
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
                                                                                        <a href="https://www.Telr.com" style="text-decoration:none;color:#ffffff;outline:0;outline:none;border:0;border:none" target="_blank"><img src="${logo}" title="Telr" alt="Telr" style="margin:auto;text-align:center;border:0;outline:none;text-decoration:none;height:40px!important" align="middle" border="0" class="CToWUd" data-bit="iit"></a>
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
                                                                                    <td align="left" valign="top" style="border-collapse:collapse;<b>TELR0900091</b>"><span style="border-collapse:collapse;width:100%;display:block; font-weight: bolder;">Email Verification </span><span style="border-collapse:collapse;font-size:16px;font-weight:500;width:100%;display:block"></span></td>
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
                                                                                    <td width="100%" align="left" valign="top" style="border-collapse:collapse;<b>TELR0900091</b>">Dear ${data.name},
                                                                                        <br><br>Your account is registered with  Telr! <br><br>In order to set your password and activate your account, please click the button below:</td>
                                                                                </tr>
                                                                            </tbody>
                                                                        </table>
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td align="left" valign="middle" style="border-collapse:collapse;padding:25px 8px 10px;font-size:12px">
                                                                        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%">
                                                                            <tbody>
                                                                                <tr>
                                                                                    <td width="100%" align="middle" valign="top" style="border-collapse:collapse;<b>TELR0900091</b>; padding: 10px;"><a href="${data.url}"><button style="background-color: #056e4e;padding: 10px;border-radius: 10px;color: white;width: 80% !important;font-size: 20px;border: 0;">Verify Email</button></a></td>
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
                                                    <td style="border-collapse:collapse;padding:32px;background:#ffffff;font-family:'roboto',Arial,Helvetica,sans-serif">
                                                        <p style="padding:0;margin:0">If the button above doesn't work, please paste the link below into your browser <a href="${data.url}" style="color:#056e4e; text-decoration: none" target="_blank" data-saferedirecturl="${data.url}">${data.url}</a><a>                                                                    </a></p><a>
</a></td></tr><tr><td style="border-collapse:collapse;padding:16px 32px; font-family:'roboto',Arial,Helvetica,sans-serif;font-size:12px"><table align="center" border="0" cellpadding="0" cellspacing="0" width="100%"><tbody><tr><td align="middle" valign="middle" style="border-collapse:collapse;font-weight:normal"><b style="color: #056e4e;">Telr</b>,
Dubai Digital Park,
Dubai,
UAE <br><small>Learn more about Telr's <a href="https://telr.com/sa-en/legal/privacy-policy/" style="text-decoration: none; color:#056e4e">security and privacy policy</a>, and our <a href="https://telr.com/sa-en/resources/getting-started/onboarding/" style="text-decoration: none;color:#056e4e">verification process.</a></small>
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
        </td>
        </tr>
        </tbody>
        </table>
        
        
        
        
        <p>&nbsp;
            <br></p>
    </div>
</div>`
}