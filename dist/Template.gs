class Template {
  static 値を埋め込む座標を取得(sheet,anchor='$'){
    const values = sheet.getDataRange().getValues()
    let indexes = { 'keyName': [0, 0] }
    indexes = {}
    values.forEach((row, rowIdx) => {
      row.forEach((value, colIdx) => {
        if (/^\$.+/.test(value)) {
          const keyName = value.replace('$', '')
          indexes[keyName] = [rowIdx, colIdx]
        }
      })
    })
    const reversedIndexes ={}
    for(const key of Object.keys(indexes).reverse()){
      reversedIndexes[key] = indexes[key]
    }
    return reversedIndexes
  }

  static スプシフォーマットの値を取得(sheet, coordinates={'anchorName':[0,0]}) {
    if (!sheet){
      throw 'スプレッドシートが指定されていません'
    }
    const coordinatesの型判定 = Object.values(coordinates).every(c=>{
      return Number.isInteger(c[0]) && Number.isInteger(c[0])
    })
    if(!coordinatesの型判定){
      throw '座標の型が適切ではありません'
    }

    // スプシフォーマットから値を取得
    const スプシフォーマットvalues = sheet.getDataRange().getValues()
    return Object.entries(coordinates).reduce((item,[anchorName,[rowIdx,colIdx]])=>{
      return Object.assign(item,{[anchorName]:スプシフォーマットvalues[rowIdx][colIdx]})
    },{})
  }

  static ひな型をコピーしてスプシフォーマットを作成(ひな形sheet=SpreadsheetApp.getActiveSheet(),newFileName,格納folder) {
    if(!ひな形sheet){
      throw 'ひな形sheetを指定してください'
    }
    if(!格納フォルダ){
      throw '格納folderを指定してください'
    }

    const newSS = SpreadsheetApp.create(newFileName || ひな形sheet.getName())
    ひな型sheet.copyTo(newSS)
    newSS.deleteActiveSheet()
    DriveApp.getFileById(newSS.getId()).moveTo(格納folder)
    return newSS
  }

  static スプシフォーマットに行を挿入(スプシフォーマットURL,data){
    const スプシフォーマットsheet = SpreadsheetApp.openByUrl(スプシフォーマットURL).getActiveSheet()
    const indexes = Format.getIndexes(スプシフォーマットsheet)
    Object.entries(indexes).forEach(([key,position])=>{
      if(Array.isArray(data[key])){
        スプシフォーマットsheet.insertRowsBefore(position[0]+1,data[key].length-1)
        スプシフォーマットsheet.getRange(position[0]+1,position[1]+1).setValue('$'+key)
        スプシフォーマットsheet.getRange(position[0]+data[key].length,position[1]+1).setValue('')
      }
    })
  }

  static スプシフォーマットに値をセット(sheet,coordinates,data) {


    const range = sheet.getDataRange()
    const values = range.getValues()
    const formulas = range.getFormulas()

    Object.entries(coordinates).forEach(([key, [rowIdx, colIdx]]) => {
      if(Array.isArray(data[key])){
        data[key].forEach((row,i)=>{
          values[rowIdx+i].splice(colIdx,row.length,...row)
        })
      }else{
        values[rowIdx][colIdx] = data[key]        
      }
    }) 

    range.setValues(values)
    // 数式が入ってあったセルは、数式を上書き
    formulas.forEach((row,i)=>{
      row.forEach((formula,j)=>{
        if(formula){
          sheet.getRange(i+1,j+1).setFormula(formula)
        }
      })
    })

    return sheet
  }

  static スプシフォーマットからpdfを作成_簡易版(sheet,newFileName,格納folder=DriveApp.createFolder()) {

    const newPdfBlob = sheet.getAs('application/pdf')
    newPdfBlob.setName(newFileName || sheet.getName())
    const newPdfFile = 格納folder.createFile(newPdfBlob)

    return newPdfFile
  }

  static スプシフォーマットからpdfを作成(sheet,newFileName,格納folder) {

    const spreadsheetID = sheet.getParent().getId()

    const url = 'https://docs.google.com/spreadsheets/d/' +  spreadsheetID + '/export?'
    // PDF出力のオプションを設定
    const options = 'exportFormat=pdf&format=pdf'
    + '&gid=' + sheet.getSheetId()  //PDFにするシートの「シートID」
    + '&portrait=false'  //true(縦) or false(横)
    + '&size=A4'         //印刷サイズ
    + '&fitw=true'       //true(幅を用紙に合わせる) or false(原寸大)
    + '&gridlines=false' //グリッドラインの表示有無
    + '&range=A1%3AO34'   //★POINT★セル範囲を指定。 %3A はコロン(:)を表す

    const requestUrl = url + options;
      
    //API使用のためのOAuth認証
    const token = ScriptApp.getOAuthToken();

    const params = {
      'headers' : {'Authorization':'Bearer ' + token},
      'muteHttpExceptions' : true,
      "validateHttpsCertificates" : false,
      "followRedirects" : true
    };

    const response = UrlFetchApp.fetch(requestUrl, params);

    //Blobオブジェクトを作成
    const blob = response.getBlob();
    blob.setName(newFileName + '.pdf'); //PDFファイル名を設定

    //指定のフォルダにPDFファイルを作成
    const newPdfFile = 格納folder.createFile(blob); 

    return newPdfFile
  }
}
