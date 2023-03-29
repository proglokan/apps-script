function onOpen() {
  SpreadsheetApp.getUi()
  .createMenu('llama')
  .addItem('Order Processing', 'regionalControlCenter9')
  .addItem('Check Rows', 'checkRowIndexColumn')
  .addItem('Pull Data', 'pullData')
  .addItem('Check out', 'checkOut')
  .addItem('endOfDay', 'endOfDay')
  .addToUi();
}