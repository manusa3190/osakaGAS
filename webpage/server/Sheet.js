// version 20240314

class Sheet {
  constructor({spreadsheet,sheetName,spreadsheetId,spreadsheetUrl,key列名}){
    if(spreadsheet){
      this.spreadsheet = spreadsheet
    }else if(spreadsheetId){
      this.spreadsheet = SpreadsheetApp.openById(spreadsheetId)
    }else if(spreadsheetUrl){
      this.spreadsheet = SpreadsheetApp.openByUrl(spreadsheetUrl)
    }else{
      this.spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
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
    const rows = this.sheet.getDataRange().getValues()
    const columns = rows.shift() || []

    // ヘッダーのチェック
    this.columns = columns.map((colName,i)=>{
      if(!colName){
        console.log(`警告! columnsに文字列以外の値があります。${this.sheet.getName()}, ${i}`)
        return ''
      }else{
        return String(colName).replaceAll(/ |　|\n|\t/g,'_')
      }
    })

    this.values = rows
  }

  get items(){
    return this.values.map(row=>{
      return this.columns.reduce((item,columnName,idx)=>{
        let value = row[idx]
        // セルの値が';'を含んでいる場合は配列に変換する
        if(typeof(value)==='string' && value.includes(';')){
          value = value.split(';')
        }
        return Object.assign(item,{[columnName]:value})
      },{})
    })
  }

  get docs(){
    return this.items.reduce((docs,item)=>{
      return Object.assign(docs,{[item[this.key列名]]:item})
    },{})
  }

  getNewId(){ // 8文字のユニークな文字列を返します
    let newId;
    do{
      newId = Utilities.getUuid().slice(0,8);
    }while(!Object.keys(this.docs).includes(newId) && /\d{8}/.test(newId))

    return newId
  }

  setColumns(columns){
    if(!columns || !Array.isArray(columns)){
      console.log('columnsに配列を渡してください')
    }
    this.sheet.getRange(1,1,1,columns.length).setValues([columns])
  }

  convertItemToRow(item={}){
    return this.columns.map(colName=>{
        let value = item[colName]
        // 配列はセミコロン;で区切った文字列にする
        if(Array.isArray(value))value = value.join(';')
          
        // Date型に変換可能な文字列（yyyy-mm-dd）はDate型にする。その際、日本時刻に直す必要がある
        if(/(19|20)\d{2}-\d{2}-\d{2}/.test(value)){
          value = new Date(value) // 世界標準時
          value.setHours(value.getHours()-9)
        }
        return value
      })
  }

  setItem(item){
      if(typeof(item)!=='object')throw(`itemがObject型以外です。sheetName:${this.sheet.getName()},type:${typeof(item)}`)
      if(!item[this.key列名])throw(`itemのkey列名がundefinedかnullか空白文字列です。sheetName:${this.sheet.getName()},item:${item}`)

      const newRow = this.convertItemToRow(item)
      
      const index = this.items.findIndex(e=>e[this.key列名]===item[this.key列名])
      
      if(index<0){
        this.sheet.appendRow(newRow)
      }else{
        this.sheet.getRange(index+2,1,1,this.columns.length).setValues([newRow])
      }
  }

  setItems(items=[],group列名=''){
      if(!Array.isArray(items))throw(`setItemsに配列でない値が渡されました。sheetName:${this.sheet.getName()}`)
      if(!items.length)return

      if(items.length && items.some(item=>typeof(item)!=='object'))throw(`setItemsに渡された配列の要素にObject以外が渡されました。sheetName:${this.sheet.getName()}`)

      let otherItems = []
      if(group列名){
        const givenItemsGroupKey = items[0][group列名]
        otherItems = this.items.filter(item => item[group列名]!==givenItemsGroupKey)
      }else{
        //group列名を指定しなかった場合は、itemの追加・変更はできるが削除はできずに残るので注意
        const givenItemsIds = items.map(item=>item[this.key列名])
        otherItems = this.items.filter(item => !givenItemsIds.includes(item[this.key列名]))
      }
      
      // idが空白のitemはidを付与
      items.forEach(item=>item[this.key列名] = item[this.key列名]? item[this.key列名]:this.getNewId())

      const newItems = otherItems.concat(items)
      this.renew(newItems)
  }

  remove(id){
    const index = this.items.findIndex(item=>item[this.key列名] === id)
    this.sheet.deleteRow(index+2)      
  }

  // 既存のアイテムを全て消し、新しいアイテムに置き換えます
  renew(items){
    const values = items.map(item=>this.convertItemToRow(item))
    values.unshift(this.columns)
    this.sheet.clear()
    this.sheet.getRange(1,1,values.length,this.columns.length).setValues(values)
  }
}
