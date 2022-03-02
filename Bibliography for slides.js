function insertUpdateBibliography() {
  const ui = SlidesApp.getUi();

  try {
    const preso = SlidesApp.getActivePresentation();
    presoId = preso.getId();

    //let result = validateLinks(validate = false);
    let result = validateLinks(validate = false, getparams = false);
    let validationSite, zoteroItemKey, zoteroItemGroup, bibLink, zoteroItemKeyParameters, biblTexts, targetRefLinks;
    let bibReferences = [];
    if (result.status == 'ok') {
      validationSite = result.validationSite;
      zoteroItemKey = result.zoteroItemKey;
      zoteroItemGroup = result.zoteroItemGroup;
      bibLink = validationSite + zoteroItemKey;
      zoteroItemKeyParameters = result.zoteroItemKeyParameters;
      targetRefLinks = result.targetRefLinks;
      if (result.bibReferences.length > 0) {
        bibReferences = result.bibReferences;
        //Logger.log('bibReferences' + bibReferences);

        //resultBiblTexts = forestAPIcall(validationSite, zoteroItemKey, bibReferences, presoId);
        //forestAPIcall(validationSite, zoteroItemKey, zoteroItemGroup, bibReferences, docOrPresoId, target, mode = 'bib')
        resultBiblTexts = forestAPIcall(validationSite, zoteroItemKey, zoteroItemGroup, bibReferences, presoId, targetRefLinks, 'bib');
        if (resultBiblTexts.status == 'error') {
          ui.alert(resultBiblTexts.message);
          return 0;
        }
        biblTexts = resultBiblTexts.biblTexts;
      } else {
        Logger.log('Links for bibliography weren\'t found.');
        ui.alert('Links for bibliography weren\'t found.');
      }
    } else {
      // Error in validateLinks!
      return 0;
    }



    // Task 5 2021-04-13
    let bibIntroText, additionalText = '', fontSize, foregroundColor;

    if (targetRefLinks == 'zotero') {
      bibIntroText = 'The bibliography entries in this document link to our internal Zotero library. In the final version of this document, the links will be replaced with links to ';
      bibLink = validationSite;
      fontSize = 10;
      foregroundColor = '#000000';
      additionalText = '. Do not edit the bibliography entries below - edit them in Zotero instead. Any changes that you make to bibliography entries below will be overwritten.';
    } else {
      bibIntroText = 'This bibliography is available digitally in our evidence library at ';
      bibLink = validationSite + zoteroItemKey;
      fontSize = 1;
      foregroundColor = '#ffffff';
    }
    // End. Task 5 2021-04-13




    let groupIdItemKey, bibLinkParagraph;
    let str, str2, rangeElementStart, rangeElementEnd, startDelete, endDelete, startEndFound = false;

    const slides = preso.getSlides();
    const numOfSlides = slides.length;
    for (let i = numOfSlides - 1; i >= 0; i--) {
      if (startEndFound) {
        break;
      }

      slides[i].getPageElements().forEach(function (pageElement) {
        if (pageElement.getPageElementType() == SlidesApp.PageElementType.SHAPE) {
          rangeElementStart = pageElement.asShape().getText().find(textToDetectStartBib);
          rangeElementEnd = pageElement.asShape().getText().find(textToDetectEndBib);

          if ((rangeElementStart.length > 0 && rangeElementEnd.length > 0)) {
            startEndFound = true;
            startDelete = rangeElementStart[0].getEndIndex();
            endDelete = rangeElementEnd[0].getStartIndex();
            pageElement.asShape().getText().getRange(startDelete, endDelete).clear();
            // appendBibParagraphsOld(rangeElementStart[0], bibReferences, zoteroItemKeyParameters);
            rangeElementEnd[0].setText('\n' + textToDetectEndBib).getRange(0, textToDetectEndBib.length + 1).getTextStyle().setFontSize(fontSize).setForegroundColor(foregroundColor);
            //rangeElementEnd[0].setText('\n' + textToDetectEndBib);



            rangeElementStart[0].appendText('\n' + bibIntroText).getRange(0, bibIntroText.length).getTextStyle().setFontSize(18).setForegroundColor('#000000');
            rangeElementStart[0].appendText(bibLink).getRange(0, bibLink.length).getTextStyle().setLinkUrl(bibLink).setFontSize(18);
            if (targetRefLinks == 'zotero') {
              rangeElementStart[0].appendText(additionalText).getRange(0, additionalText.length).getTextStyle().setFontSize(18).setForegroundColor('#000000');
            }

            appendBibParagraphs(rangeElementStart[0], biblTexts);

            rangeElementStart[0].getRange(0, textToDetectStartBib.length).getTextStyle().setFontSize(fontSize).setForegroundColor(foregroundColor);
          }
        }
      });



    }

    //startEndFound = false;
    if (startEndFound === false) {
      const newPageElements = preso.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY).getPageElements();
      newPageElements[0].asShape().getText().setText('Bibliography');
      const biblShapeText = newPageElements[1].asShape().getText();
      biblShapeText.appendParagraph(textToDetectStartBib).getRange().getTextStyle().setFontSize(fontSize).setForegroundColor(foregroundColor);

      biblShapeText.appendText(bibIntroText).getRange(0, bibIntroText.length).getTextStyle().setFontSize(18).setForegroundColor('#000000');;
      // biblShapeText.appendParagraph(bibLink).getRange().getTextStyle().setLinkUrl(bibLink);
      biblShapeText.appendText(bibLink).getRange(0, bibLink.length).getTextStyle().setLinkUrl(bibLink);
      if (targetRefLinks == 'zotero') {
        biblShapeText.appendText(additionalText).getRange(0, additionalText.length).getTextStyle().setFontSize(18).setForegroundColor('#000000');
      }

      appendBibParagraphs(biblShapeText, biblTexts);
      biblShapeText.appendParagraph(textToDetectEndBib).getRange().getTextStyle().setFontSize(fontSize).setForegroundColor(foregroundColor);
    }
  }
  catch (error) {
    ui.alert('Error in insertUpdateBibliography. ' + error);
  }
}

function appendBibParagraphs(biblShapeText, biblTexts) {
  Logger.log('appendBibParagraphs');

  for (let i = 0; i < biblTexts.length; i++) {
    Logger.log(biblTexts[i].text);
    if (biblTexts[i].name == 'a') {
      biblShapeText.appendText(biblTexts[i].text).getRange(0, biblTexts[i].text.length).getTextStyle().setLinkUrl(biblTexts[i].link).setItalic(false).setFontSize(18);
    } else if (biblTexts[i].name == 'i') {
      biblShapeText.appendText(biblTexts[i].text).getRange(0, biblTexts[i].text.length).getTextStyle().setItalic(true).setFontSize(18).setForegroundColor('#000000');
    } else {
      biblShapeText.appendText(biblTexts[i].text).getRange(0, biblTexts[i].text.length).getTextStyle().setItalic(false).setFontSize(18).setForegroundColor('#000000');
    }
  }

}
