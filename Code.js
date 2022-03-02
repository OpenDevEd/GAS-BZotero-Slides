function onOpen(e) {
  let targetMenuString, kerkoValidationSite, zoteroItemKeyAction, zoteroCollectionKeyAction, opendevedUser = false;
  // https://developers.google.com/workspace/add-ons/concepts/editor-auth-lifecycle#the_complete_lifecycle
  let targetRefLinks;

  if (e && e.authMode == ScriptApp.AuthMode.NONE) {
    targetMenuString = 'Target: Zotero; change to Kerko';
    kerkoValidationSite = '<Enter validation site>';
    zoteroItemKeyAction = 'Add/change';
    zoteroCollectionKeyAction = 'Add/change';
    targetRefLinks = 'zotero';
  } else {
    const activeUser = Session.getEffectiveUser().getEmail();
    if (activeUser.search(/opendeved.net/i) != -1) {
      opendevedUser = true;
    }
    kerkoValidationSite = getDocumentPropertyString('kerko_validation_site');
    if (kerkoValidationSite == null) {
      if (activeUser.search(/edtechhub.org/i) != -1) {
        kerkoValidationSite = 'https://docs.edtechhub.org/lib/';
      } else if (opendevedUser) {
        kerkoValidationSite = 'https://docs.opendeved.net/lib/';
      } else {
        kerkoValidationSite = '<Enter validation site>';
      }
    }

    targetRefLinks = getDocumentPropertyString('target_ref_links');
    /*
    // This made the load fail (for docs that had not targetRefLinks set).
    if (!targetRefLinks) {
      targetRefLinks = 'zotero';
      setDocumentPropertyString('target_ref_links', targetRefLinks);
    };
    */
    if (targetRefLinks == 'kerko') {
      targetMenuString = 'Target: Kerko; change to Zotero';
    } else {
      targetMenuString = 'Target: Zotero; change to Kerko';
    }
    let currentZoteroCollectionKey = getDocumentPropertyString('zotero_collection_key');
    zoteroCollectionKeyAction = currentZoteroCollectionKey == null ? 'Add' : 'Change';

    let currentZoteroItemKey = getDocumentPropertyString('zotero_item');
    zoteroItemKeyAction = currentZoteroItemKey == null ? 'Add' : 'Change';
  }

  let menu = SlidesApp.getUi().createMenu('BZotero');
  // let where = ' on ' + kerkoValidationSite;
  let where = ' via ' + targetRefLinks;

  menu.addItem('Update/validate document links' + where, 'validateLinks');
  menu.addItem('Insert/update bibliography', 'insertUpdateBibliography');
  menu.addSeparator();

  menu.addItem(zoteroItemKeyAction + ' Zotero item key for this doc', 'addZoteroItemKey')
  menu.addItem(zoteroCollectionKeyAction + ' Zotero collection key for this doc', 'addZoteroCollectionKey')
  menu.addSubMenu(SlidesApp.getUi().createMenu('Configure Zotero interation')
    .addItem(targetMenuString, 'targetReferenceLinks')
    .addItem('Enter validation site', 'enterValidationSite')
  );

  menu.addSubMenu(SlidesApp.getUi().createMenu('Additional functions')
    .addItem('zpack Turn Zotero text citations into links', 'packZotero')
    .addItem('zunpack Turn Zotero links into text', 'unpackZotero')
  );

  menu.addToUi();
}


function validateLinks(validate = true, getparams = true) {
  let ui = SlidesApp.getUi();
  try {
    let bibReferences = [];
    let alreadyCheckedLinks = new Object();

    // Task 9 2021-04-13 (1)
    let targetRefLinks = getDocumentPropertyString('target_ref_links');
    if (targetRefLinks == null) {
      targetRefLinks = 'zotero';
    }

    // Task 10 2021-04-13
    if (targetRefLinks == 'zotero' && validate && getparams) {
      // 2021-05-11 Update
      validate = false;
      const response = ui.alert('The reference links in this document point to the Zotero app', "Your links will only be rewritten; they will not be validated. If you are about to share this document with somebody who does not have access to the Zotero library, please switch the link target to ‘evidence library’ first.", ui.ButtonSet.OK_CANCEL);

      if (response == ui.Button.CANCEL) {
        return 0;
      }
    }
    // End. Task 10 2021-04-13

    // BZotero 2 Task 1
    let currentZoteroItemKey = getDocumentPropertyString('zotero_item');
    if (currentZoteroItemKey == null && !validate && !getparams) {
      //     addZoteroItemKey();
      scanForItemKey(targetRefLinks);
    } else if (currentZoteroItemKey == null && validate && getparams) {
      const addZoteroItemKeyResult = addZoteroItemKey(errorText = '', optional = true, bibliography = false, targetRefLinks);
      if (addZoteroItemKeyResult == 'abortValidation') {
        return 0;
      }
    }

    // 2021-05-11 Update
    let zoteroItemKeyParameters, zoteroItemGroup, zoteroItemKey;
    currentZoteroItemKey = getDocumentPropertyString('zotero_item');
    Logger.log('currentZoteroItemKey=' + currentZoteroItemKey);
    if (currentZoteroItemKey == null) {
      if (targetRefLinks == 'zotero') {
        zoteroItemKeyParameters = '';
        zoteroItemGroup = '';
        zoteroItemKey = '';
      } else {
        return 0;
      }
    } else {
      const zoteroItemKeyParts = currentZoteroItemKey.split('/');
      zoteroItemKeyParameters = zoteroItemKeyParts[4] + ':' + zoteroItemKeyParts[6];
      zoteroItemGroup = zoteroItemKeyParts[4];
      zoteroItemKey = zoteroItemKeyParts[6];
    }
    // End. 2021-05-11 Update


    let zoteroCollectionKey;
    let currentZoteroCollectionKey = getDocumentPropertyString('zotero_collection_key');
    if (currentZoteroCollectionKey == null && targetRefLinks == 'zotero' && autoPromptCollection) {
      addZoteroCollectionKey('', true, false);
      currentZoteroCollectionKey = getDocumentPropertyString('zotero_collection_key');
      if (currentZoteroCollectionKey == null) {
        if (validate == true && getparams == true) {
          validate = false;
        }
      }
    }

    if (currentZoteroCollectionKey != null) {
      const zoteroCollectionKeyParts = currentZoteroCollectionKey.split('/');
      zoteroCollectionKey = zoteroCollectionKeyParts[6];
    } else {
      zoteroCollectionKey = '';
    }

    // End. Task 9 2021-04-13 (1)

    // BZotero Task 0
    // UserProperty -> DocumentProperty Update
    let validationSite = getDocumentPropertyString('kerko_validation_site');
    if (validationSite == null) {
      const activeUser = Session.getEffectiveUser().getEmail();
      if (activeUser.search(/edtechhub.org/i) != -1) {
        validationSite = 'https://docs.edtechhub.org/lib/';
      } else if (activeUser.search(/opendeved.net/i) != -1) {
        validationSite = 'https://docs.opendeved.net/lib/';
      } else {
        enterValidationSite();
        // UserProperty -> DocumentProperty Update
        validationSite = getDocumentPropertyString('kerko_validation_site');
        if (validationSite == null) {
          ui.alert('Please enter Validation site');
          return 0;
        }
      }

      //Logger.log('Default validationSite');
    }
    // End. BZotero Task 0  



    let links, result, linkText, notiBrokenLinks, link;
    let notiTextBroken, notiTextUnknownLibrary, notiText = ''
    const slides = SlidesApp.getActivePresentation().getSlides();
    for (let i in slides) {
      slides[i].getPageElements().forEach(function (pageElement) {
        if (pageElement.getPageElementType() == SlidesApp.PageElementType.SHAPE) {

          rangeElementStart = pageElement.asShape().getText().find(textToDetectStartBib);
          rangeElementEnd = pageElement.asShape().getText().find(textToDetectEndBib);

          if ((rangeElementStart.length > 0 && rangeElementEnd.length > 0)) {
            Logger.log('Bibliography slide. Dont collect links!');
          } else {
            links = pageElement.asShape().getText().getLinks();
            //Logger.log(links);
            for (let j in links) {
              link = links[j].getTextStyle().getLink().getUrl();
              result = checkHyperlink(bibReferences, alreadyCheckedLinks, link, validationSite, zoteroItemKeyParameters, targetRefLinks, zoteroCollectionKey, validate);
              if (result.status == 'error') {
                ui.alert(result.message);
                return 0;
              }

              if (validate || getparams) {

                if (result.type == 'BROKEN LINK' && validate) {
                  notiBrokenLinks = true;
                  notiTextBroken = true;
                  //Logger.log('BROKEN LINK');
                  linkText = links[j].asRenderedString();
                  if (!/<BROKEN LINK>/i.test(linkText)) {
                    links[j].setText('<BROKEN LINK>' + linkText);

                    //links[j].getRange(13, linkText.length + 13).getTextStyle().setLinkUrl(link);
                    links[j].getTextStyle().setLinkUrl(link);
                    links[j].getRange(0, 13).getTextStyle().setBackgroundColor('#ff0000').setForegroundColor('#000000').setUnderline(false);
                  } else {
                    //Logger.log('Already marked as broken.');
                  }
                }

                if (result.type == 'NORMAL LINK') {
                  //Logger.log('N LINK');
                  if (result.url != link) {
                    Logger.log('Set another link');
                    links[j].getTextStyle().setLinkUrl(result.url);
                  }
                }

                if (result.permittedLibrary == false) {
                  notiTextUnknownLibrary = true;
                  linkText = links[j].asRenderedString();
                  if (!/<UNKNOWN LIBRARY>/i.test(linkText)) {
                    links[j].setText('<UNKNOWN LIBRARY>' + linkText);
                    links[j].getTextStyle().setLinkUrl(link);
                    links[j].getRange(0, 16).getTextStyle().setBackgroundColor('#ff0000').setForegroundColor('#000000').setUnderline(false);
                  } else {
                    //Logger.log('Already marked as unknown library.');
                  }

                }


              }
            }
          }
        }
      });
    }


    if (notiTextBroken && validate) {
      notiText = 'There were broken links. Please search for BROKEN LINK.';
    }
    if (notiTextUnknownLibrary) {
      notiText += '\nThere were unknown libraries. Please search for UNKNOWN LIBRARY.';
    }
    if (notiText != '') {
      ui.alert(notiText);
    }

    if (validate === false || getparams === false) {
      Logger.log('targetRefLinks (validate links)' + targetRefLinks);
      return { status: 'ok', bibReferences: bibReferences, validationSite: validationSite, zoteroItemGroup: zoteroItemGroup, zoteroItemKey: zoteroItemKey, zoteroItemKeyParameters: zoteroItemKeyParameters, targetRefLinks: targetRefLinks };
    }
  }
  catch (error) {
    ui.alert('Error in validateLinks: ' + error);
  }
}


function packZotero() {
  const ui = SlidesApp.getUi();
  try {
    const redirectTarget = 'https://ref.opendeved.net/zo/';
    const regex = /^⟦(zg)?\:([^\:\|]*)\:([^\:\|]+)\|(.*?)⟧$/;

    let ranges, text, urlpart, found;
    let counter = 0;

    const slides = SlidesApp.getActivePresentation().getSlides();
    for (let i in slides) {
      slides[i].getPageElements().forEach(function (pageElement) {
        if (pageElement.getPageElementType() == SlidesApp.PageElementType.SHAPE) {
          ranges = pageElement.asShape().getText().find('⟦.*?⟧');

          for (let j in ranges) {
            text = ranges[j].asRenderedString();
            found = text.match(regex);
            if (found) {
              counter++;
              Logger.log(found[0] + '-' + found[1] + '-' + found[2] + '-' + found[3] + '-' + found[4]);
              if (found) {
                if (!found[1]) {
                  found[1] = 'zg';
                };
                if (!found[2]) {
                  found[2] = '2249382';
                };
                // found[4] = encodeURIComponent(found[4]);
                urlpart = found[1] + '/' + found[2] + '/7/' + found[3] + '/' + found[4]; // +"//"+text;
              } else {
                urlpart = 'NA/' + text;
              };
              //Logger.log(urlpart);
              ranges[j].setText('⇡' + found[4]).getTextStyle().setLinkUrl(redirectTarget + urlpart);
            }
          }
        }
      });
    }

    ui.alert('Number of citations that were Zotero-packed:' + counter);
  }
  catch (error) {
    ui.alert('Error in packZotero ' + error);
  }
}

function unpackZotero() {
  const ui = SlidesApp.getUi();

  try {
    let links, link, groupId, itemKey, linkText, opendevedPartLink, array;

    let counter = 0;
    const opendevedRgEx = new RegExp('http[s]*://ref.opendeved.net/zo/zg/', 'i');
    const urlRegEx = new RegExp('https?://ref.opendeved.net/zo/zg/[0-9]+/7/[^/]+/?', 'i');

    const slides = SlidesApp.getActivePresentation().getSlides();
    for (let i in slides) {
      slides[i].getPageElements().forEach(function (pageElement) {
        if (pageElement.getPageElementType() == SlidesApp.PageElementType.SHAPE) {
          links = pageElement.asShape().getText().getLinks();
          //Logger.log(links);
          for (let j in links) {
            link = links[j].getTextStyle().getLink().getUrl();
            Logger.log(link);
            if (link.search(urlRegEx) == 0) {
              Logger.log('Yes----------------------');
              opendevedPartLink = link.replace(opendevedRgEx, '');
              array = opendevedPartLink.split('/');
              groupId = array[0];
              itemKey = array[2];
              linkText = array[3];

              newText = `⟦zg:${groupId}:${itemKey}|${linkText}⟧`;
              Logger.log(newText);
              links[j].setText(newText).getTextStyle().setLinkUrl(null).setBackgroundColorTransparent();
              counter++;
            }
          }
        }
      });
    }

    ui.alert('Number of citations that were Zotero-unpacked: ' + counter);
  }
  catch (error) {
    ui.alert('Error in unpackZotero ' + error);
  }
}

