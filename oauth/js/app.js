// ======================================
// OAuth example of OTDS and AppWorks Platform
// For educational purpose only
// JOPL, 16-03-2018

// ======================================
// Change below variable to you local configuration
var localOtdsConfig = {
    otdsServer: "http://pct035.opentext.net",
    otdsResouce: "srv-nl-trunk",
    otdsClientId: "jopl-oauth-client"
}

// local vars
var appConfig = {
  localStorageJWTKey: "awpOAuthJOPLWebToken"
}

// ======================================
// Handle oauth token, if present, in onload
$(window).on("load", function() {
  getAccessTokenFromUrl();
  if (localStorage.getItem(appConfig.localStorageJWTKey)) {
    console.log("local storage access-token: "+localStorage.getItem(appConfig.localStorageJWTKey));
  }
  refreshButtonStatus();
});

// ======================================
// Get access token from url, store it in browser local-storage and replace browser url
function getAccessTokenFromUrl() {
  var hashAT="#access_token=";
  var oauthUrlFragment = window.location.hash;

  if (oauthUrlFragment.indexOf(hashAT) < 0) {
    return null; // No access_token on url
  } else {
    var accessToken = oauthUrlFragment.substring(
                          oauthUrlFragment.indexOf(hashAT)+hashAT.length,
                          oauthUrlFragment.indexOf("&"));  
    // store this oauth token
    localStorage.setItem(appConfig.localStorageJWTKey, accessToken);

    console.log("OAuth access-token from url: "+accessToken);

    // TODO 1 - get expires_in url parameter from url
    // Redirect to the same url but now without the access_token in it
    window.location.replace(window.location.href.substring(
                            0, window.location.href.indexOf(hashAT)));
  }
  // Browser url is replace, so we're not coming here
}

// ======================================
// Set button status according to availablity of access-token
function refreshButtonStatus() {
  if (localStorage.getItem(appConfig.localStorageJWTKey)) {
    $("#get-data-button").attr("disabled", false );
    $("#clear-oauth-button").attr("disabled", false );
  } else {
    $("#get-data-button").attr("disabled", true );
    $("#clear-oauth-button").attr("disabled", true );
  }
}

// ======================================
// OAuth button handler
$("#get-oauth-button").click(function() {
  var oauthParams = {
    scope: "resource:"+localOtdsConfig.otdsResouce,
    response_type: "token",
    client_id: localOtdsConfig.otdsClientId,
    redirect_uri: window.location.href
  };
  window.location.replace(localOtdsConfig.otdsServer+"/otdsws/login?"+$.param(oauthParams));
});

// ======================================
// Clear OAuth token button handler
$("#clear-oauth-button").click(function() {
  localStorage.removeItem(appConfig.localStorageJWTKey);
  refreshButtonStatus();
});

// ======================================
// OAuth button handler
$("#get-data-button").click(function() {
  if ($("#get-data-button").attr("disabled")) return;

  // Example SOAP call to AppWorks Platform. This also can be a RESt call...
  console.log("POST request to Cordys with OAuth token")
  $.ajax({
    url: "/cordys/com.eibus.web.soap.Gateway.wcp",
    method: "POST",
    contentType: "text/xml",
    headers: {
      'Authorization': "Bearer "+ localStorage.getItem(appConfig.localStorageJWTKey),
    },
    data: '<SOAP:Envelope xmlns:SOAP="http://schemas.xmlsoap.org/soap/envelope/">'+
          '  <SOAP:Body>'+
          '    <GetUserDetails xmlns="http://schemas.cordys.com/1.0/ldap"/>'+
          '  </SOAP:Body>'+
          '</SOAP:Envelope>',
    success : function(response) {
      var authuserdn = response.getElementsByTagName("authuserdn")[0].childNodes[0].nodeValue;
      var description = response.getElementsByTagName("description")[0].childNodes[0].nodeValue;
      $("#user-authuserdn").text(authuserdn);
      $("#user-description").text(description);
    },
    error : function (xhr, ajaxOptions, thrownError){  
      console.log(xhr.status);          
      console.log(thrownError);
      $("#user-authuserdn").text("...");
      $("#user-description").text("...");
      },
    complete : function(xhr, textStatus) {
      $("#http-status").text(xhr.status);
    }
  });
});