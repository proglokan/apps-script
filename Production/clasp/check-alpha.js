function check() {
  const id = '1stzXZ0bp-aodyUAgYHppTuAMfgc-PtrQQRIOqgTTye4';
  const sheet = SpreadsheetApp.openById(id).getSheetByName('Mar 2023');
  const range = sheet.getRange('AV3:AV');
  const rawVals = range.getValues();
  for (let x = 0; x < rawVals.length; ++x) {
    if (+rawVals[x][0] === +rawVals[x + 1][0] - 1) continue;
    else Logger.log(rawVals[x][0])
  }
}
