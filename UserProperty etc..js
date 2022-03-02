// For testing
function deleteDocumentPropertyStringZoteroItemKey() {
  var documentProperties = PropertiesService.getDocumentProperties();
  documentProperties.deleteProperty('zotero_item');
  documentProperties.deleteProperty('zotero_collection_key');
}

function setDocumentPropertyString(property_name, value) {
  var documentProperties = PropertiesService.getDocumentProperties();
  documentProperties.setProperty(property_name, value);
}

function getDocumentPropertyString(property_name) {
  var documentProperties = PropertiesService.getDocumentProperties();
  var value = documentProperties.getProperty(property_name);
  return value;
}

function enterValidationSite(errorText = '') {
  // UserProperty -> DocumentProperty Update
  const kerkoValidationSite = getDocumentPropertyString('kerko_validation_site');
  if (kerkoValidationSite != null) {
    errorText += '\nCurrent Validation Site:\n' + kerkoValidationSite + '\n';
  }

  const ui = SlidesApp.getUi();
  const response = ui.prompt('Validation site', errorText + '\nPlease enter the validation site, e.g. in the form of https://docs.edtechhub.org/lib/', ui.ButtonSet.OK_CANCEL);

  if (response.getSelectedButton() == ui.Button.OK) {
    let url = response.getResponseText().trim();
    if (url.charAt(url.length - 1) != '/') url += '/';
    const urlRegEx = new RegExp('https?://', 'i');
    if (url.search(urlRegEx) == 0) {
      // UserProperty -> DocumentProperty Update
      setDocumentPropertyString('kerko_validation_site', url);
      onOpen();
    } else {
      enterValidationSite('Error!\n');
    }
  }
}

function scanForItemKey(targetRefLinks) {

  let rangeElementStart, tableText, libLink, result;
  let foundFlag = false;

  const slides = SlidesApp.getActivePresentation().getSlides();
  for (let i in slides) {
    if (foundFlag) {
      break;
    } else {
      slides[i].getPageElements().forEach(function (pageElement) {
        if (pageElement.getPageElementType() == SlidesApp.PageElementType.SHAPE) {

          rangeElementStart = pageElement.asShape().getText().find('docs.edtechhub.org/lib/[^/]+|docs.opendeved.net/lib/[^/]+');
          if (rangeElementStart.length > 0) {
            tableText = rangeElementStart[0].asRenderedString();
            libLink = /docs.edtechhub.org\/lib\/[a-zA-Z0-9]+|docs.opendeved.net\/lib\/[a-zA-Z0-9]+/.exec(tableText);
            if (libLink != null) {
              Logger.log('libLink ' + libLink);
              result = detectZoteroItemKeyType('https://' + libLink);
              if (result.status == 'error') {
                addZoteroItemKey('', false, false, targetRefLinks);
                return 0;
              }
              foundFlag = true;
            }
          }
        }
      });
    }
  }

  if (!foundFlag) {
    addZoteroItemKey('', false, false, targetRefLinks);
  }
}


function targetReferenceLinks() {
  let currentTargetRefLinks = getDocumentPropertyString('target_ref_links');
  // UserProperty -> DocumentProperty Update
  const kerkoValidationSite = getDocumentPropertyString('kerko_validation_site');


  if (currentTargetRefLinks == null) {
    // UserProperty -> DocumentProperty Update
    setDocumentPropertyString('target_ref_links', 'zotero');
    currentTargetRefLinks = 'zotero';
  }

  const proposedTargetRefLinks = (currentTargetRefLinks == 'zotero') ? 'kerko' : 'zotero';

  const ui = SlidesApp.getUi();
  const response = ui.alert('Advanced option: Target for reference links',
    `Chose whether the reference links in this document should open in Zotero or on ${kerkoValidationSite} (kerko). 
  
If you are preparing this document for publication, please set target to ‘kerko’. If this is currently an internal document, please set target to 'zotero'.
  
Current target: ‘${currentTargetRefLinks}’.

Do you wish to change the target to ‘${proposedTargetRefLinks}’?`, ui.ButtonSet.YES_NO);

  if (response == ui.Button.YES) {
    setDocumentPropertyString('target_ref_links', proposedTargetRefLinks);
    onOpen();
    const response2 = ui.alert('You have changed the target for reference links', 'The links will now be reconfigured.', ui.ButtonSet.OK_CANCEL);
    if (response2 == ui.Button.OK) {
      Logger.log('Validate links');
      validateLinks(false, true, false);
    }
  }

}


function addZoteroCollectionKey(errorText = '', optional = false, bibliography = false) {
  Logger.log('Function addZoteroCollectionKey ' + ' optional = ' + optional + ' bibliography = ' + bibliography);
  let currentZoteroCollectionKey = getDocumentPropertyString('zotero_collection_key');
  if (currentZoteroCollectionKey == null) {
    currentZoteroCollectionKey = '(you haven\'t set up Zotero collection key)';
  }

  const optionalText = optional ? "Optional: " : "";
  const bibText = bibliography ? "If you do not have the key, press ‘cancel’ to proceed to inserting the bibliography anyway.\n\n" : "";

  const ui = SlidesApp.getUi();
  const response = ui.prompt(optionalText + 'Zotero Collection Key', errorText + 'Current collection key: ' + currentZoteroCollectionKey + '.\n\nWhile this document is internal, the reference links open the corresponding item in Zotero. If you have a Zotero collection for your items, the reference links can open the Zotero items in the context of the Zotero collection. To enable this, please enter the Zotero collection key here.\n\nYou can obtain the Zotero collection key using Zutilo; In the Zutlio preferences (“User Interface”), enable ”‘Zotero collection menu -> Get select collection link”; then right click on the collection, copy the collection link, and paste it below.\n\n' + bibText + 'Please enter Zotero collection key as a zotero://select-link.', ui.ButtonSet.OK_CANCEL);

  if (response.getSelectedButton() == ui.Button.OK) {
    const zoteroCollectionItem = response.getResponseText();
    const zoteroCollectionRegEx = new RegExp('zotero://select/groups/[0-9]+/collections/[^/]+', 'i');
    if (zoteroCollectionRegEx.test(zoteroCollectionItem)) {
      setDocumentPropertyString('zotero_collection_key', zoteroCollectionItem);
    } else {
      addZoteroCollectionKey('Error! Wrong Zotero collection key.\n', optional, bibliography);
    }
  }
  onOpen();
}

function addZoteroItemKey(errorText = '', optional = false, bibliography = false, targetRefLinks) {
  const currentZoteroItemKey = getDocumentPropertyString('zotero_item');
  if (currentZoteroItemKey != null) {
    errorText += '\nCurrent Zotero Item Key:\n' + currentZoteroItemKey + '\n';
  }
  const optionalText = optional ? "Optional: " : "";
  const bibText = bibliography ? "\nIf you do not have the key, press ‘cancel’ to proceed to inserting the bibliography anyway." : "";

  const ui = SlidesApp.getUi();
  const response = ui.prompt(optionalText + 'Enter the Zotero item key', errorText + '\nPlease enter Zotero item key as a zotero://select link (which you can copy with Zutilo in the Zotero app) or use the url to this item in the evidence library. If this document has a document citation (e.g., on the second page), you can find the link there.\n\nPlease enter the link and click ok.' + bibText, ui.ButtonSet.OK_CANCEL);

  if (response.getSelectedButton() == ui.Button.OK) {
    let zotero_item = response.getResponseText();

    let res = detectZoteroItemKeyType(zotero_item);
    if (res.status == 'error') {
      addZoteroItemKey(res.message, optional, bibliography, targetRefLinks);
    }
  } else if (response.getSelectedButton() == ui.Button.CANCEL) {
    if (targetRefLinks == 'kerko') {
      const notification = ui.alert('For validation against the evidence library a Zotero item key is required.', 'Please obtain the key from Zotero or your reference, and try again.', ui.ButtonSet.OK);
    }
  }
}

// addZoteroItemKey, scanForItemKey use the function
function detectZoteroItemKeyType(zotero_item) {
  const zoteroItemRegEx = new RegExp('zotero://select/groups/[0-9]+/items/[^/]+', 'i');
  const etechhubItemRegEx = new RegExp('https://docs.edtechhub.org/lib/[^/]+', 'i');
  const opendevedItemRegEx = new RegExp('https://docs.opendeved.net/lib/[^/]+', 'i');

  // Previous
  // const itemKey = zotero_item.split('/')[4];
  // New 2021-04-24
  let itemKey;
  const checkId = /id=[a-zA-Z0-9]+&?/.exec(zotero_item);

  if (checkId == null) {
    itemKey = zotero_item.split('/')[4];
  } else {
    if (checkId[0].charAt(checkId[0].length - 1) == '&') {
      checkId[0] = checkId[0].slice(0, -1);
    }
    itemKey = checkId[0].slice(3);
  }
  // End. New 2021-04-24

  let setDP = false;

  if (zoteroItemRegEx.test(zotero_item)) {
    setDP = true;
  } else if (etechhubItemRegEx.test(zotero_item)) {
    zotero_item = 'zotero://select/groups/2405685/items/' + itemKey;
    setDP = true;
  } else if (opendevedItemRegEx.test(zotero_item)) {
    zotero_item = 'zotero://select/groups/2129771/items/' + itemKey;
    setDP = true;
  }

  if (setDP) {
    setDocumentPropertyString('zotero_item', zotero_item);
    onOpen();
    return { status: 'ok' };
  } else {
    //addZoteroItemKey('Error! Wrong Zotero Item Key\n', optional, bibliography);
    return { status: 'error', message: 'Error! Wrong Zotero Item Key\n' };
  }

}

