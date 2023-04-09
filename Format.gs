class Format {
  constructor({ ひな型ID, 管理用sheet, key列名, スプシ格納フォルダ, pdf格納フォルダ }) {
    this.p = PropertiesService.getScriptProperties()
    this.ひな型ID = ひな型ID
    this.sheet = 管理用sheet
    const values = this.sheet.getDataRange().getValues()
    this.columns = values.shift();
    // 列名に'updatedAt',​'spreadsheetURL'​,'pdfID',​'pdfURL'があるかチェック
    ['updatedAt', 'spreadsheetURL', 'pdfID', 'pdfURL'].forEach(colName => {
      if (!this.columns.includes(colName)) {
        console.log(`${colName}がありません。列を付け加えてください`)
        throw null
      }
    })
    this.key列名 = key列名 ? key列名 : this.columns[0]

    this.items = values.map(row => {
      return this.columns.reduce((item, colName, idx) => {
        return Object.assign(item, { [colName]: row[idx] })
      }, {})
    })

    this.スプシ格納フォルダ = スプシ格納フォルダ
    this.pdf格納フォルダ = pdf格納フォルダ
  }

  get docs() {
    return this.items.reduce((docs, item) => {
      return Object.assign(docs, { [item[this.key列名]]: item })
    }, {})
  }

  _ひな型からインデックスを取り出し() {
    const ひな型values = SpreadsheetApp.openById(this.ひな型ID).getActiveSheet().getDataRange().getValues()
    let indexes = { 'keyName': [0, 0] }
    indexes = {}
    ひな型values.forEach((ひな型row, rowIdx) => {
      ひな型row.forEach((ひな型value, colIdx) => {
        if (/^<.+>$/.test(ひな型value)) {
          const keyName = ひな型value.replace('<', '').replace('>', '')
          indexes[keyName] = [rowIdx, colIdx]
        }
      })
    })
    return indexes
  }

  _スプシフォーマットとデータの値に違いがあるか(data, spreadsheetURL) {
    if (!spreadsheetURL) return true

    // スプシフォーマットから値を取得
    const スプシフォーマットvalues = SpreadsheetApp.openByUrl(spreadsheetURL).getDataRange().getValues()
    const indexes = this._ひな型からインデックスを取り出し()
    const スプシフォーマットitem = Object.entries(indexes).reduce((item, [key, [rowIdx, colIdx]]) => {
      return Object.assign(item, { [key]: スプシフォーマットvalues[rowIdx][colIdx] })
    }, {})

    return Object.entries(スプシフォーマットitem).some(([key, スプシvalue]) => {
      // 管理表sheetに列名がないものはチェックを無視。
      if (!(key in data)) return false
      return スプシvalue !== data[key]
    })
  }

  _スプシフォーマットからpdfを作成(spreadsheetURL,newFileName) {
    const スプシフォーマット = SpreadsheetApp.openByUrl(spreadsheetURL)
    const newPdfBlob = スプシフォーマット.getAs('application/pdf')
    newPdfBlob.setName(newFileName || スプシフォーマット.getName())
    const newPdfFile = DriveApp.createFile(newPdfBlob)
    newPdfFile.moveTo(this.pdf格納フォルダ)
    return { pdfID: newPdfFile.getId(), pdfURL: newPdfFile.getUrl() }
  }

  _ひな型をコピーしてスプシフォーマットを作成(newFileName) {
    const newFile = DriveApp
      .getFileById(this.ひな型ID)
      .makeCopy()
      .moveTo(this.スプシ格納フォルダ)
      .setName(newFileName || data[this.key列名])
    return newFile.getUrl()
  }

  _スプシフォーマットに値をセット(スプシフォーマットURL,data) {
    const スプシフォーマットsheet = SpreadsheetApp.openByUrl(スプシフォーマットURL).getActiveSheet()
    const スプシフォーマットrange = スプシフォーマットsheet.getDataRange()
    const スプシフォーマットvalues = スプシフォーマットrange.getValues()
    const スプシフォーマットformulas = スプシフォーマットrange.getFormulas()
    const indexes = this._ひな型からインデックスを取り出し()
    Object.entries(indexes).forEach(([key, [rowIdx, colIdx]]) => {
      スプシフォーマットvalues[rowIdx][colIdx] = data[key]
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

  _setValueToColumn(rowIndex, columnName, value) {
    if(rowIndex<0){
      console.log('渡されたデータにkeyとなる値がありません')
    }
    this.sheet.getRange(
      rowIndex + 2,
      this.columns.findIndex(colName => colName === columnName) + 1
    ).setValue(value)
  }

  データからスプシフォーマットの作成だけ実行(data, newFileName) {
    const スプシフォーマットURL = this._ひな型をコピーしてスプシフォーマットを作成(newFileName)
    this._スプシフォーマットに値をセット(スプシフォーマットURL, data)

    // 管理表にupdatedAtやspreadsheetURLをセット
    const rowIndex = Object.keys(this.docs).findIndex(key=>key===data[this.key列名])
    this._setValueToColumn(rowIndex, 'updatedAt', new Date())
    this._setValueToColumn(rowIndex, 'spreadsheetURL', スプシフォーマットURL)
  }

  スプシフォーマットからpdfの作成だけ実行(spreadsheetURL,newFileName) {
    const { pdfID, pdfURL } = this._スプシフォーマットからpdfを作成(spreadsheetURL,newFileName)

    // 管理表にupdatedAtやspreadsheetURLをセット
    const rowIndex = this.items.findIndex(item => item.spreadsheetURL === spreadsheetURL)
    this._setValueToColumn(rowIndex, 'updatedAt', new Date())
    this._setValueToColumn(rowIndex, 'pdfID', pdfID)
    this._setValueToColumn(rowIndex, 'pdfURL', pdfURL)
  }


  スプシフォーマット更新とpdf作成の両方実行(data, newFileName) {
    const { spreadsheetURL, pdfID } = this.docs[data[this.key列名]]

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
