const p = PropertiesService.getScriptProperties()

function getデータ一覧() {
  const データ一覧 = new Sheet({spreadsheetId:p.getProperty('データ一覧')})
  return JSON.stringify(データ一覧.docs)
}

function setデータ(データ){
  const データ一覧 = new Sheet({spreadsheetId:p.getProperty('データ一覧')})
  データ一覧.setItem(JSON.parse(データ))
  return 'OK'
}
