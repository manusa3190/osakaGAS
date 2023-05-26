class Format {
  constructor({ ひな型sheet, データsheet, 作成管理sheet, key列名, スプシ格納フォルダ, pdf格納フォルダ }) {

    if(!スプシ格納フォルダ){
      console.log('生成したスプレッドシートを格納するフォルダを指定してください。{スプシ格納フォルダ:Folder}')
      throw null
    }
    this.スプシ格納フォルダ = スプシ格納フォルダ

    if(!pdf格納フォルダ){
      console.log('生成したpdfを格納するフォルダを指定してください。{pdf格納フォルダ:Folder}')
      throw null
    }    
    this.pdf格納フォルダ = pdf格納フォルダ

    if(!ひな型sheet){
      console.log('ひな型sheetを指定してください。{ひな型sheet:Sheet}')
      throw null
    }
    this.ひな型sheet = ひな型sheet

    if(!データsheet){
      console.log('書き込むデータを記載しているスプレッドシートを指定してください。{データsheet:String}')
      throw null 
    } 
    this.データsheet = データsheet

    if(!作成管理sheet){
      console.log('作成管理用のスプレッドシートを指定してください。{作成管理sheet:Sheet}')
      throw null       
    }
    this.作成管理sheet = 作成管理sheet

    const values = this.作成管理sheet.getDataRange().getValues()
    const columns = values.shift();
    this.key列名 = key列名 ? key列名 : columns[0];
    // 列名に'updatedAt',​'spreadsheetURL'​,'pdfID',​'pdfURL'があるかチェック
    ['updatedAt', 'spreadsheetURL', 'pdfID', 'pdfURL'].forEach(colName => {
      if (!columns.includes(colName)) {
        console.log(`${colName}がありません。列を付け加えてください`)
        throw null
      }
    })

    this.作成管理items = values.map(row => {
      return columns.reduce((item, colName, idx) => {
        return Object.assign(item, { [colName]: row[idx] })
      }, {})
    })
  }

  static getIndexes(sheet){
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

  _スプシフォーマットとデータの値に違いがあるか(data, spreadsheetURL) {
    if (!spreadsheetURL) return true

    // スプシフォーマットから値を取得
    const スプシフォーマットvalues = SpreadsheetApp.openByUrl(spreadsheetURL).getDataRange().getValues()
    const indexes = Format.getIndexes(this.ひな型sheet)
    const スプシフォーマットitem = Object.entries(indexes).reduce((item, [key, [rowIdx, colIdx]]) => {
      return Object.assign(item, { [key]: スプシフォーマットvalues[rowIdx][colIdx] })
    }, {})

    return Object.entries(スプシフォーマットitem).some(([key, スプシvalue]) => {
      // 管理表sheetに列名がないものはチェックを無視。
      if (!(key in data)) return false
      return スプシvalue !== data[key]
    })
  }

  _ひな型をコピーしてスプシフォーマットを作成(newFileName) {
    const newSS = SpreadsheetApp.create(newFileName || data[this.key列名])
    this.ひな型sheet.copyTo(newSS)
    newSS.deleteActiveSheet()
    DriveApp.getFileById(newSS.getId()).moveTo(this.スプシ格納フォルダ)
    return newSS.getUrl()
  }

  _スプシフォーマットに行を挿入(スプシフォーマットURL,data){
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

  _スプシフォーマットに値をセット(スプシフォーマットURL,data) {
    const スプシフォーマットsheet = SpreadsheetApp.openByUrl(スプシフォーマットURL).getActiveSheet()
    const スプシフォーマットrange = スプシフォーマットsheet.getDataRange()
    const スプシフォーマットvalues = スプシフォーマットrange.getValues()
    const スプシフォーマットformulas = スプシフォーマットrange.getFormulas()

    const indexes = Format.getIndexes(スプシフォーマットsheet)
    Object.entries(indexes).forEach(([key, [rowIdx, colIdx]]) => {
      if(Array.isArray(data[key])){
        data[key].forEach((row,i)=>{
          スプシフォーマットvalues[rowIdx+i].splice(colIdx,row.length,...row)
        })
      }else{
        スプシフォーマットvalues[rowIdx][colIdx] = data[key]        
      }

    }) 

    スプシフォーマットrange.setValues(スプシフォーマットvalues)
    // 数式が入ってあったセルは、数式を上書き
    スプシフォーマットformulas.forEach((row,i)=>{
      row.forEach((formula,j)=>{
        if(formula){
          スプシフォーマットsheet.getRange(i+1,j+1).setFormula(formula)
        }
      })
    })
  }

  _スプシフォーマットからpdfを作成(スプシフォーマットURL,newFileName) {
    const スプシフォーマット = SpreadsheetApp.openByUrl(スプシフォーマットURL)
    const newPdfBlob = スプシフォーマット.getAs('application/pdf')
    newPdfBlob.setName(newFileName || スプシフォーマット.getName())
    const newPdfFile = DriveApp.createFile(newPdfBlob)
    newPdfFile.moveTo(this.pdf格納フォルダ)
    return { pdfID: newPdfFile.getId(), pdfURL: newPdfFile.getUrl() }
  }  

  _setValueToColumn(rowIndex, columnName, value) {
    if(rowIndex<0){
      console.log('渡されたデータにkeyとなる値がありません')
    }
    this.sheet.getRange(
      rowIndex + 2,
      this.columns.findIndex(colName => colName === columnName) + 1
    ).setValue(value)
  }

  スプシフォーマット作成のみ実行(data, newFileName) {
    const スプシフォーマットURL = this._ひな型をコピーしてスプシフォーマットを作成(newFileName)
    this._スプシフォーマットに値をセット(スプシフォーマットURL, data)

    // 管理表にupdatedAtやspreadsheetURLをセット
    const rowIndex = this.作成管理items.findIndex(item=>item[this.key列名]===data[this.key列名])
    this._setValueToColumn(rowIndex, 'updatedAt', new Date())
    this._setValueToColumn(rowIndex, 'spreadsheetURL', スプシフォーマットURL)
  }

  pdf作成のみ実行(spreadsheetURL,newFileName) {
    const { pdfID, pdfURL } = this._スプシフォーマットからpdfを作成(spreadsheetURL,newFileName)

    // 管理表にupdatedAtやspreadsheetURLをセット
    const rowIndex = this.作成管理items.findIndex(item => item.spreadsheetURL === spreadsheetURL)
    this._setValueToColumn(rowIndex, 'updatedAt', new Date())
    this._setValueToColumn(rowIndex, 'pdfID', pdfID)
    this._setValueToColumn(rowIndex, 'pdfURL', pdfURL)
  }

  スプシフォーマット更新とpdf作成の両方実行(data, newFileName) {
    const { spreadsheetURL, pdfID } = this.作成管理items.find(item=>item[this.key列名]===data[this.key列名])

    // スプシフォーマットとデータの値に違いがなければ、処理は進めない
    if (!this._スプシフォーマットとデータの値に違いがあるか(data, spreadsheetURL)) {
      return
    }

    // 古いスプシフォーマットは削除する
    if (spreadsheetURL) {
      const oldスプシフォーマットID = SpreadsheetApp.openByUrl(spreadsheetURL).getId()
      DriveApp.getFileById(oldスプシフォーマットID).setTrashed(true)
    }
    if (pdfID) {
      DriveApp.getFileById(pdfID).setTrashed(true)
    }

    const スプシフォーマットURL = this._ひな型をコピーしてスプシフォーマットを作成(newFileName)
    this._スプシフォーマットに値をセット(スプシフォーマットURL,data)
    SpreadsheetApp.flush() // スプレッドシートの処理を終わらせないと、変数に値が入る前のスプレッドシートでpdfを作成してしまう
    const { pdfID: newPdfID, pdfURL } = this._スプシフォーマットからpdfを作成(スプシフォーマットURL,newFileName)

    // 管理表にupdatedAtやspreadsheetURLをセット
    const rowIndex = Object.keys(this.docs).findIndex(key=>key===data[this.key列名])
    this._setValueToColumn(rowIndex, 'updatedAt', new Date())
    this._setValueToColumn(rowIndex, 'spreadsheetURL', スプシフォーマットURL)
    this._setValueToColumn(rowIndex, 'pdfID', newPdfID)
    this._setValueToColumn(rowIndex, 'pdfURL', pdfURL)

    return {
      spreadsheetID: スプシフォーマットURL,
      pdfID: newPdfID
    }
  }

}
