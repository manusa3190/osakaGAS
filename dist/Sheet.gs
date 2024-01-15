class Sheet {
  constructor({spreadsheet,spreadsheetId,spreadsheetUrl, sheetName,key列名}){
    if(spreadsheet){
      this.spreadsheet = spreadsheet
    }else if(spreadsheetId){
      this.spreadsheet = SpreadsheetApp.openById(spreadsheetId)
    }else if(spreadsheetUrl){
      this.spreadsheet = SpreadsheetApp.openByUrl(spreadsheetUrl)
    }else{
      try{
        this.spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
      }catch(err){
        console.log('アクティブなスプレッドシートがありません。コンテナバインドでない可能性があります')
      }
    }

    if(sheetName){
      this.sheet = this.spreadsheet.getSheetByName(sheetName)
    }else{
      this.sheet = this.spreadsheet.getSheets()[0]
    }

    this.fetch()
    this.key列名 = key列名? key列名:this.columns[0]
  }

  fetch(){
    const rows=this.sheet.getDataRange().getValues()
    const colNames = rows.shift()
    this.columns = colNames.map(colName=>colName.replaceAll(' '))
    this.values = rows
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
    const itemToValues = (item) => this.columns.map(colName=>{
      let value = item[colName]
      // セルに入れる値。配列であればセミコロン;で区切った文字列にする
      if(Array.isArray(value))value = value.join(';')
        
      // Date型に変換可能な文字列（yyyy-mm-dd）であればDate型にする
      if(/(1|2)\d{3}-\d{2}-\d{2}/.test(value))value = new Date(value)

      return value
    })

    const id = item[this.key列名]
    if(id===undefined)throw('idがundefinedとなっています')
    if( id===null || id==='' || id==='new'){
      var newId;
      while(true){
        newId = Utilities.getUuid().slice(0,8)
        if(!Object.keys(this.docs).includes(newId))break;
      }

      item[this.key列名] = newId

      this.sheet.appendRow(itemToValues(item))
      return newId
    }else{
      const index = this.items.findIndex(e=>e[this.key列名]===item[this.key列名])
      this.sheet.getRange(index+2,1,1,this.columns.length).setValues([itemToValues(item)])
      return id
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
