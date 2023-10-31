class Template {
  static isSheet(obj){
    return obj && typeof obj.getDataRange === 'function';
  }

  static セル値とアドレスを取得(sheet){ //-> {value:[rowIdx,colIdx]}
    if(!Template.isSheet(sheet)){
      console.log('「セル値とアドレスを取得」にSheetが渡されませんでした')
    }

    const addresses = {}

    const values = sheet.getDataRange().getValues()
    values.forEach((row, rowIdx) => {
      row.forEach((value, colIdx) => {
          if(!value)return
          addresses[value] = [rowIdx,colIdx]
      })
    })

    return addresses
  }

  // 削除予定
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

  static ひな型をコピーしてスプシフォーマットを作成(ひな型sheet=SpreadsheetApp.getActiveSheet(),newFileName,格納folder) {
    if(!Template.isSheet(ひな型sheet)){
      console.log('ひな型をコピーしてスプシフォーマットを作成でSheetが渡されませんでした')
    }
    if(!格納folder){
      throw '格納folderを指定してください'
    }

    const newSS = SpreadsheetApp.create(newFileName || ひな型sheet.getName())
    ひな型sheet.copyTo(newSS)
    newSS.deleteActiveSheet()
    DriveApp.getFileById(newSS.getId()).moveTo(格納folder)
    return newSS
  }

  // 削除予定
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

  static スプシフォーマットの行追加とdataのフラット化(sheet=SpreadsheetApp.getActiveSheet(),data={}){
      if(!Template.isSheet(sheet)){
        console.log('「スプシフォーマットの行追加とdataのフラット化」で、Sheetが渡されませんでした')
      }

      // dataのうち、配列になっているデータはフラット化する。その際、スプシは行挿入する
      const flattenData = {}
      Object.entries(data).forEach(([key1,value1])=>{
        if(Array.isArray(value1)){

            value1.forEach((item,i)=>{

              Object.entries(item).forEach(([key2,value2],j)=>{
                const key = key1+'_'+key2 + (i? '_'+i:'')
                flattenData[key] = value2

                // ターゲットの位置を決めて、行挿入する
                if(!j && !i){
                  const addresses = Template.セル値とアドレスを取得(sheet)
                  const targetAddress = addresses['$'+key]
                  if(!targetAddress){
                    console.log(`「スプシフォーマットの行追加とdataのフラット化」で${key}を入れる場所がありません`)
                    return
                  }
                  const [rowIdx,colIdx] = targetAddress

                  const 元となる行 = sheet.getRange(rowIdx+1,1,1,sheet.getLastColumn());
                  [...Array(value1.length-1)].forEach((_,k)=>{
                      sheet.insertRowAfter(rowIdx+k+1)
                      const 挿入した行 = sheet.getRange(rowIdx+k+2,1,1,sheet.getLastColumn())
                      元となる行.copyTo(挿入した行, SpreadsheetApp.CopyPasteType.PASTE_NORMAL,false)
                      挿入した行.setValues(元となる行.getValues().map(e=>{
                        return e.map(val=>val.startsWith('$')? val + '_' + (k+1):val)
                      }))
                  })
                }
              })
            })

        }else if(typeof(value1)==='string' || typeof(value1)==='number'){
          flattenData[key1] = value1
        }else{
          console.log('プリミティブあるいは配列でないデータが渡されました')
        }
      })

      return flattenData
  }

  static スプシフォーマットに値をセット(sheet=SpreadsheetApp.getActiveSheet(),data={}) {
    // sheetが渡されているか確認
    if(!Template.isSheet(sheet)){
      console.log('「スプシフォーマットに値をセット」で、Sheetが渡されませんでした')
    }

    // dataがフラットであるか確認
    Object.values(data).forEach(value=>{
      if(Array.isArray(value)){
        console.log('「スプシフォーマットに値をセット」で、フラット化されていないデータが渡されました')
      }
    })

    // セルの値を取得
    const range = sheet.getDataRange()
    const values = range.getValues()
    const formulas = range.getFormulas()

    // valuesにdataの値を割り当てる
    const addresses = Template.セル値とアドレスを取得(sheet)
    Object.entries(data).forEach(([key,val]) => {
        const address = addresses['$'+key]
        if(!address){
          console.log(`${key}を入れる場所が見つかりません`)
          return
        }
        const [rowIdx,colIdx] = address
        values[rowIdx][colIdx] = val
    })

    // sheetに値をセット
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
