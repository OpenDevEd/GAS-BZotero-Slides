// The same for Docs
function testAddSrcToURL() {
  addSrcToURL('https://www.test.com', 'zotero', '8970789789', 'U7U8U9');
}

function addSrcToURL(url, targetRefLinks, srcParameter, zoteroCollectionKey) {

  if (srcParameter == '') {
    const checkSrc = /src=[a-zA-Z0-9:]+&?/.exec(url);
    //Logger.log(checkCollection);
    if (checkSrc != null) {
      url = url.replace(checkSrc[0], '');
    }
  } else {
    url = replaceAddParameter(url, 'src', srcParameter);
  }

  if (targetRefLinks == 'zotero') {
    url = replaceAddParameter(url, 'collection', zoteroCollectionKey);
    url = replaceAddParameter(url, 'openin', 'zoteroapp');
  } else {

    const checkCollection = /collection=[a-zA-Z0-9]+&?/.exec(url);
    //Logger.log(checkCollection);
    if (checkCollection != null) {
      url = url.replace(checkCollection[0], '');
    }

    const checkOpenin = /openin=zoteroapp&?/.exec(url);
    //Logger.log(checkOpenin);
    if (checkOpenin != null) {
      url = url.replace(checkOpenin[0], '');
    }

  }

  // 2021-05-11 Update (if lastChar == '?')
  const lastChar = url.charAt(url.length - 1);
  if (lastChar == '&' || lastChar == '?') {
    url = url.slice(0, -1);
  }
  Logger.log(url);

  return url;
}


function replaceAddParameter(url, name, srcParameter) {
  if (url.indexOf(srcParameter) == -1) {
    const srcPos = url.indexOf(name + '=');
    if (srcPos == -1) {
      const questionMarkPos = url.indexOf('?');
      //Logger.log(questionMarkPos);
      if (questionMarkPos == -1) {
        url += '?' + name + '=' + srcParameter;
      } else {
        if (url.length == (questionMarkPos + 1)) {
          url += name + '=' + srcParameter;
        } else {
          url += '&' + name + '=' + srcParameter;
        }
      }
    } else {
      const str = url.substr(srcPos + name.length + 1)
      //Logger.log(str);
      let replaceStr;
      const ampPos = str.indexOf('&');
      if (ampPos == -1) {
        replaceStr = str;
      } else {
        replaceStr = str.substr(0, ampPos);
        //Logger.log(replaceStr);
      }
      url = url.replace(replaceStr, srcParameter);
    }
  }
  return url;
}

function checkHyperlink(bibReferences, alreadyCheckedLinks, url, validationSite, zoteroItemKeyParameters, targetRefLinks, zoteroCollectionKey, validate) {
  let result, urlWithParameters;
  let urlRegEx = new RegExp('https?://ref.opendeved.net/zo/zg/[0-9]+/7/[^/]+/?', 'i');

  if (url.search(urlRegEx) == 0) {
    Logger.log('Yes----------------------');

    if (alreadyCheckedLinks.hasOwnProperty(url)) {
      result = alreadyCheckedLinks[url];
    } else {
      result = checkLink(url, validationSite, validate);
      if (result.status == 'error') {
        return result;
      }
      alreadyCheckedLinks[url] = result;

      //Logger.log('alreadyCheckedLinks' + JSON.stringify(alreadyCheckedLinks));
    }


    if (bibReferences.indexOf(result.bibRef) == -1) {
      bibReferences.push(result.bibRef);
    }

    /* Previous version
        if (result.type == 'NORMAL LINK') {
    
          urlWithParameters = addSrcToURL(result.url, zoteroItemKeyParameters);
          Logger.log('urlWithParameters = ' + urlWithParameters);
    
        } else if (result.type == 'BROKEN LINK') {
    
          Logger.log('BROKEN LINK');
    
        }
        return { status: 'ok', type: result.type, url: urlWithParameters };
       End. Previous version */

    // Task 9 2021-04-13
    if (!validate || result.type == 'BROKEN LINK') {
      urlWithParameters = addSrcToURL(url, targetRefLinks, zoteroItemKeyParameters, zoteroCollectionKey);
    } else {
      urlWithParameters = addSrcToURL(result.url, targetRefLinks, zoteroItemKeyParameters, zoteroCollectionKey);
    }
    // End. Task 9 2021-04-13

    // if (validate || getparams) {
    //   item.textRun.textStyle.underline = false;
    //   item.textRun.textStyle.link.url = urlWithParameters;
    //   requests.push({
    //     updateTextStyle: {
    //       textStyle: item.textRun.textStyle,
    //       range: {
    //         startIndex: item.startIndex,
    //         endIndex: item.endIndex
    //       },
    //       fields: '*'
    //     }
    //   });
    //   if (segmentId) {
    //     requests[requests.length - 1].updateTextStyle.range.segmentId = segmentId;
    //   }

    // }

    // 2021-05-11 Update
    // Previous if (result.type == 'BROKEN LINK') {
    // if (result.type == 'BROKEN LINK' && validate) {
    //   brokenOrphanedLinks.push({ segmentId: segmentId, startIndex: item.startIndex, text: BROKEN_LINK_MARK });
    // }

    // if (result.permittedLibrary == false) {
    //   brokenOrphanedLinks.push({ segmentId: segmentId, startIndex: item.startIndex, text: UNKNOWN_LIBRARY_MARK });
    // }
    return { status: 'ok', type: result.type, url: urlWithParameters, permittedLibrary: result.permittedLibrary};
  }
  return { status: 'ok' };
}

function checkLink(url, validationSite, validate) {
  let urlOut, itemKeyOut;
  let opendevedPartLink, itemKeyIn, groupIdIn;

  let validationSiteRegEx = new RegExp(validationSite, 'i');
  let opendevedRgEx = new RegExp('http[s]*://ref.opendeved.net/zo/zg/', 'i');

  opendevedPartLink = url.replace(opendevedRgEx, '');
  let array = opendevedPartLink.split('/');
  groupIdIn = array[0];
  itemKeyIn = array[2];
  const questionPos = itemKeyIn.indexOf('?');
  if (questionPos != -1) {
    itemKeyIn = itemKeyIn.slice(0, questionPos);
  }

  // let newUrl = validationSite + groupIdIn + ':' + itemKeyIn;

  // New code Adjustment of broken links  2021-05-03
  let new_Url;
  if (groupIdIn == '2405685' || groupIdIn == '2129771') {
    newUrl = validationSite + itemKeyIn;
  } else {
    newUrl = validationSite + groupIdIn + ':' + itemKeyIn;
  }
  Logger.log('newUrl=' + newUrl);
  // End. New code Adjustment of broken links  2021-05-03 

  // 2021-05-11 Update
  let result;
  if (validate) {
    Logger.log('Validation!');
    result = detectRedirect(newUrl);
    if (result.status == 'error') {
      return result;
    }
  } else {
    Logger.log('Without validation');
    result = { status: 'ok', type: 'NORMAL LINK' };
  }
  // End. 2021-05-11 Update

  let resultDetectGroupId = detectGroupId(validationSite);
  if (resultDetectGroupId.status == 'error') {
    return resultDetectGroupId;
  }
  let grourIdOut = resultDetectGroupId.grourId;

  if (validate && result.type == 'NORMAL LINK') {
    urlOut = result.url;
    if (urlOut.search(validationSiteRegEx) != 0) {
      return { status: 'error', message: 'Unexpected redirect URL ' + urlOut + ' for link ' + url + ' Script expects ' + validationSite };
    }
    itemKeyOut = urlOut.replace(validationSiteRegEx, '');
    if (itemKeyOut.indexOf('/') != -1) {
      itemKeyOut = itemKeyOut.split('/')[0];
    }

    url = url.replace(groupIdIn, grourIdOut);
    url = url.replace(itemKeyIn, itemKeyOut);

    result.url = url;
  } else {
    grourIdOut = groupIdIn;
    itemKeyOut = itemKeyIn;
  }

  // 2021-05-14 Update
  //permittedLibraries
  let permittedLibrary = false;
  for (let i in permittedLibraries) {
    if (validationSite.indexOf(permittedLibraries[i].Domain) != -1) {
      if (permittedLibraries[i].Permitted.indexOf(grourIdOut) != -1) {
        permittedLibrary = true;
        break;
      }
    }
  }
  Logger.log(grourIdOut + ' permittedLibrary=' + permittedLibrary);
  result.permittedLibrary = permittedLibrary;
  // End. 2021-05-14 Update

  // BZotero 2 Task 2
  result.bibRef = grourIdOut + ':' + itemKeyOut;

  return result;
}

function detectGroupId(validationSite) {
  let grourIdOut;
  if (validationSite == 'https://docs.opendeved.net/lib/') {
    grourIdOut = '2129771';
  } else if (validationSite == 'https://docs.edtechhub.org/lib/') {
    grourIdOut = '2405685';
  } else {
    return { status: 'error', message: 'Incorrect validation site.' };
  }
  return { status: 'ok', grourId: grourIdOut };
}

function detectRedirect(url) {
  try {
    Logger.log(url);
    let redirect;
    let response = UrlFetchApp.fetch(url, { 'followRedirects': false, 'muteHttpExceptions': true });
    //Logger.log(response.getResponseCode());

    if (response.getResponseCode() == 404) {
      Logger.log('response.getResponseCode() == 404');
      return { status: 'ok', type: 'BROKEN LINK' }
    } else {
      let headers = response.getAllHeaders();
      if (headers.hasOwnProperty('Refresh')) {
        Logger.log('Redirect' + headers['Refresh']);
        if (headers['Refresh'].search('0; URL=') == 0) {
          redirect = headers['Refresh'].replace('0; URL=', '');
          Logger.log('  ' + redirect);
          return detectRedirect(redirect);
        }
      } else if (headers.hasOwnProperty('Location')) {
        redirect = headers['Location'];
        //Logger.log('  ' + redirect);
        return detectRedirect(redirect);
      } else {
        //Logger.log('no Redirect');
        return { status: 'ok', type: 'NORMAL LINK', url: url }
      }
    }
  }
  catch (error) {
    return { status: 'error', message: 'Error in detectRedirect: ' + error }
  }
}