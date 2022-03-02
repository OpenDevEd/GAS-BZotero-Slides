// The same for Docs
function forestAPIcall(validationSite, zoteroItemKey, zoteroItemGroup, bibReferences, docOrPresoId, target, mode = 'bib') {
  try {
    const groupkeys = bibReferences.join(',');
    //Logger.log('groupkeys = ' + groupkeys);

    const activeUser = Session.getActiveUser().getEmail();

    const apiCall = 'https://forest.opendeved.net/api?&user=' + activeUser
      + '&zkey=' + zoteroItemKey + '&zgroup=' + zoteroItemGroup
      + '&gdoc=' + docOrPresoId + '&token=' + bibapi_token + '&groupkeys=' + groupkeys + '&target=' + target + '&mode=' + mode;
     Logger.log('apiCall = ' + apiCall);

    const response = UrlFetchApp.fetch(apiCall, { 'muteHttpExceptions': true });
    //Logger.log(response.getResponseCode());
    const code = response.getResponseCode();
    let biblTexts = [];
    //Logger.log(response.getContentText());

    if (code == 200) {
      let jsonResponse = JSON.parse(response.getContentText());
      //Logger.log(jsonResponse);
      if (jsonResponse.status == 0) {
        /*
        Björn
        jsonResponse = {
          "status": 0,
          "count": 25,
          "duration": 2.645,
          "data": { }
        }
      */
        workOnBibApiElement(1, biblTexts, jsonResponse.data.elements);
        //Logger.log(biblTexts);  
        return { status: 'ok', biblTexts: biblTexts };
      } else {
        /*
        or 
        {
        "status": 1,
        "message": "message ; on 2021-04-23T22:02:46.242Z",
        }
  
        or
  
        {
        "status": 2,
        "message": "caught error in response ; on 2021-04-23T22:02:46.242Z",
        "error": "TypeError: Cannot read property 'replace' of undefined"
        }
        */
      }
      const messagestring = "Status: " + jsonResponse.status + ". Message: " + jsonResponse.message + ". Error: " + jsonResponse.error;
      return { status: 'error', message: 'Failed to retrieve data from Zotero. ' + messagestring + ". Please let your admins know about this error." };
    } else {
      // We don't want to show the API call, as it contains the API key
      // return { status: 'error', message: 'Response Code = ' + code + '  apiCall = ' + apiCall };
      return { status: 'error', message: 'Call to forestAPI failed. Response Code = ' + code + '. Please let your admins know about this error.' };
    }
  }
  catch (error) {
    return { status: 'error', message: 'Error in function forestAPIcall. Error: ' + error };
  }
}

function workOnBibApiElement(level, biblTexts, elements, name, link) {

  if (level == 3) {
    biblTexts.push({ text: '\n' });
  }

  elements.forEach(item => {
    if (item.type == 'element') {
      if (!item.attributes) {
        item.attributes = '-';
      } else {
        if (!item.attributes.href) {
          item.attributes = '-';
        }
      }
      workOnBibApiElement(level + 1, biblTexts, item.elements, item.name, item.attributes.href)
    } else {
      //Logger.log(item);
      biblTexts.push({ level: level, text: item.text, name: name, link: link });
    }
  });
}
