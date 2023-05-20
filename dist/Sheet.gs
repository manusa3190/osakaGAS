class Sheet {
  constructor({sheetName,spreadsheetId,spreadsheetUrl,key列名}){
    var spreadsheet;
    if(spreadsheetId){
      spreadsheet = SpreadsheetApp.openById(spreadsheetId)
    }else if(spreadsheetUrl){
      spreadsheet = SpreadsheetApp.openByUrl(spreadsheetUrl)
    }else{
      try{
        spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
      }catch(err){
        console.log('アクティブなスプレッドシートがありません。コンテナバインドでない可能性があります')
      }
    }

    if(sheetName){
      this.sheet = spreadsheet.getSheetByName(sheetName)
    }else{
      this.sheet = spreadsheet.getSheets()[0]
    }

    const rows=this.sheet.getDataRange().getValues()
    this.columns=rows.shift()
    this.values = rows

    this.key列名 = key列名? key列名:this.columns[0]
  }

  get items(){
    return this.values.map(row=>{
      return this.columns.reduce((item,columnName,idx)=>{
        // セルの値が';'を含んでいる場合は配列に変換する
        const value = /;/.test(row[idx])? row[idx].split(';'):row[idx]
        return Object.assign(item,{[columnName]:value})
      },{})
    })
  }

  get docs(){
    return this.items.reduce((docs,item)=>{
      return Object.assign(docs,{[item[this.key列名]]:item})
    },{})
  }

  setItem(item){
    const index = this.items.findIndex(e=>e[this.key列名]===item[this.key列名])
    const newRow = this.columns.map(colName=>{
      // セルに入れる値。配列であればセミコロン;で区切った文字列にする
      return Array.isArray(item[colName])? item[colName].join(';'):item[colName]
    })
    if(index<0){
      this.sheet.appendRow(newRow)
    }else{
      this.sheet.getRange(index+2,1,1,this.columns.length).setValues([newRow])
    }
  }

  remove(id){
    const index = this.items.findIndex(item=>item[this.key列名] === id)
    this.sheet.deleteRow(index+2)
  }

  // 既存のアイテムを全て消し、新しいアイテムに置き換えます
  renew(items){
    const values = items.map(item=>{
      return this.columns.map(colName=>{
        // セルに入れる値。配列であればセミコロン;で区切った文字列にする
        return Array.isArray(item[colName])? item[colName].join(';'):item[colName]
      })
    })
    values.unshift(this.columns)
    this.sheet.clear()
    this.sheet.getRange(1,1,values.length,this.columns.length).setValues(values)
  }
}
