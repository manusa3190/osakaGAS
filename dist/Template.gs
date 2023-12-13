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

  static スプシフォーマットの行追加とdataのフラット化(sheet=SpreadsheetApp.getActiveSheet(),data={}){
      if(!Template.isSheet(sheet)){
        console.log('「スプシフォーマットの行追加とdataのフラット化」で、Sheetが渡されませんでした')
      }

      const sheetValues = sheet.getDataRange().getValues()

      // dataのうち、配列になっているデータはフラット化する。その際、スプシは行挿入する
      const flattenData = {}
      Object.entries(data).forEach(([key1,value1],i)=>{
        if(Array.isArray(value1)){
            // 空配列の場合はデータのフラット化やスプシへの行挿入はしない
            if(!value1.length)return

            // データのフラット化
            value1.forEach((item,j)=>{
              Object.entries(item).forEach(([key2,value2])=>{
                flattenData[key1+'_'+key2+'_'+j] = value2
              })
            })

            // スプシへの行挿入
            const rowIdx = sheetValues.findIndex(row=>{
              for(const key2 in value1[0]){
                const key = '$'+ key1 + '_' + key2
                if(row.includes(key))return true
              }
            });

            const 元となる行 = sheet.getRange(rowIdx+1,1,1,sheet.getLastColumn());
            [...Array(value1.length-1)].forEach((_,k)=>{
                sheet.insertRowAfter(rowIdx+k+1)
                const 挿入した行 = sheet.getRange(rowIdx+k+2,1,1,sheet.getLastColumn())
                元となる行.copyTo(挿入した行, SpreadsheetApp.CopyPasteType.PASTE_NORMAL,false)
            })

            const 元となるvalues = 元となる行.getValues()[0]
            // 挿入した行に値をセット。その際、最後に_0,_1などのインデックス番号をつける       
            const newValues = Array(value1.length).fill().map((_,i)=>{
              return 元となるvalues.map(val=>val? val+`_${i}`:val)
            })
            sheet.getRange(rowIdx+1,1,value1.length,sheet.getLastColumn()).setValues(newValues)

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
    + '&portrait=true'  //true(縦) or false(横)
    + '&size=A4'         //印刷サイズ
    + '&fitw=true'       //true(幅を用紙に合わせる) or false(原寸大)
    + '&gridlines=false' //グリッドラインの表示有無
    + '&range=A1%3AK49'   //★POINT★セル範囲を指定。 %3A はコロン(:)を表す

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
