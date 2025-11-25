// version 20251015


// queryは必ず2次元配列
const querySample1 = [['品目コード','==',12345]]
const querySample2 = [['調査回名','==','2025年1回目'],['担当部署名','IN',['開発部,研究部']]]


////////////////////////
//      共通で使う      //
////////////////////////
const lock = LockService.getScriptLock()

function getColumnsAndItemsFromSheet(sheetName, spreadsheetId=""){
  /* このGASはトランザクションv0.5にバインドされている。
  引数にspreadsheetIdを指定しなければ、トランザクションv0.5からデータを引っ張る
  */ 
  const spreadsheet = spreadsheetId ? SpreadsheetApp.openById(spreadsheetId) : SpreadsheetApp.getActiveSpreadsheet()

  const sheet = spreadsheet.getSheetByName(sheetName)
  
  const values = sheet.getDataRange().getValues()

  const columns = values.shift()

  const items = values.map(row=>columns.reduce((item,colName,idx)=>Object.assign(item,{[colName]:row[idx]}),{}))

  return {sheet, values, columns, items:formatterToJS(items)}
}

function rollback(sheet, originalValues){
  while(true){
    try{
      sheet.getRange(1,1,originalValues.length,originalValues[0].length).setValues(originalValues)
      break
    }catch(e){
      continue
    }
  }
}

/**
 * スプレッドシートに書き込む用に、コードやリストを文字列に変換します
 */
function formatterToSpreadsheet(objects){
  if(!objects.length) return []

  return objects.map( item => Object.fromEntries(
    Object.entries(item).map( ([key,val]) =>{
      if(key.endsWith('コード')){
        return [key, String(val)]
      }
      else if(key.endsWith('リスト') && Array.isArray(val)){
        return [key, val.join(',')]
      }
      else if(key==='更新日時'){
        return [key, new Date()]
      }
      else{
        return [key, val]
      }
    })
  ))
}

/**
 * スプレッドシートからデータを読みとった際に、コードを文字列、リストを配列に変換します
 */
function formatterToJS(items){
    return items.map( item => Object.fromEntries(
      Object.entries(item).map( ([key,val]) =>{
        if(key.endsWith('コード')){
          return [key, String(val)]
        }
        else if(key.endsWith('リスト')){
          return [key, val.split(',').map(e=>e.trim())]
        }
        else{
          return [key, val]
        }
      })
    ))
}


////////////////////////
//      CRUDの関数     //
////////////////////////

function getRows(sheetName="",query){
  let {sheet, values, columns, items} = getColumnsAndItemsFromSheet(sheetName)

  // queryがJSONで渡されている場合はパースする
  try{
    query = JSON.parse(query)
  }catch(e){

  }

  if(!query){
    return items
  }

  // idが指定されている場合は、早く返すためにfindを使って検索。配列で返す
  if(query.length===1 && query[0][0]===columns[0]){
    const [idName,_,idValue] = query[0]
    const item = items.find(item=>item[idName]==idValue)
    return item? [item]:[]
  }

  // それ以外の検索はフィルター検索
  for(const q of query){
    const [fieldName,operator,fieldValue] = q
    
    if(operator === "=="){
        items = items.filter(item=>item[fieldName]==fieldValue)
    }
    else if(operator === "!="){
        items = items.filter(item=>item[fieldName]!=fieldValue)
    }
    else if(operator === "IN"){
        if(!Array.isArray(fieldValue))throw `演算子がINですが、fieldValueが配列になっていません。${fieldValue}`
        arr = fieldValue.map(val=>val.trim())
        items = items.filter(item=>arr.includes(item[fieldName]))
    }
    else if(operator === "NOT IN"){
        if(!Array.isArray(fieldValue))throw `演算子がNOT INですが、fieldValueが配列になっていません。${fieldValue}`
        arr = fieldValue.map(val=>val.trim())
        items = items.filter(item=>!arr.includes(item[fieldName]))
    }
  }

  return items
}

/**
 * データを渡すと、idを付与して返します
 */
function addRows(sheetName="",rows=[]){
  // パースとスプレッドシート用にデータ変換
  try{
    rows = JSON.parse(rows)    
  }catch(e){

  }finally{
    rows = formatterToSpreadsheet(rows)
  }

  try{
    lock.waitLock(10000)
    const {sheet, values, columns, items} = getColumnsAndItemsFromSheet(sheetName)

    const codeList = values.map(row=>String(row[0]))
    const lastCode = codeList.sort().at(-1)
    const prefix = lastCode.match(/^\D+/) ? lastCode.match(/^\D+/)[0] : ""
    const suffix = Number(lastCode.match(/\d+$/)[0])

    const newRows = rows.map((row,idx)=>columns.map((colName,i)=>{
      if(i===0){
        const code = prefix+ String( suffix + i + 1)        
        return code
      }else{
        return row[colName]
      }
    }))
    
    sheet.getRange(sheet.getLastRow()+1,1,rows.length,columns.length).setValues(newRows)

    const newItems = newRows.map(row=>columns.reduce((item,colName,idx)=>Object.assign(item,{[colName]:row[idx]}),{}))

    return formatterToJS(newItems)

  }catch(err){
    throw(sheetName,'updateRows', err)

  }finally{
    lock.releaseLock()
  }
}

/** 
 * IDがあれば更新、なければ追加
 * 強制的に書き込みします。updateと違って設定されていないフィールドの値はundefinedになります
*/
function setRows(sheetName="",rows=[]){
  // パースとバリデーション
  try{
    rows = JSON.parse(rows)
    if(rows.some(row=>!row[codeName])){
      throw "コードが設定されていないレコードがあります"
    }      
  }catch(e){

  }finally{
    rows = formatterToSpreadsheet(rows)  
  }

  try{
    // データの取得
    lock.waitLock(10000)    
    const {sheet, values, columns, items} = getColumnsAndItemsFromSheet(sheetName)

    const codeName = columns[0] // 例：""品目コード"
    
    const codeSet = new Set(values.map(v=>String(v[0])))

    // 書き込み
    const newRows = rows.map(row=>{
      const code = String(row[codeName])

      let newRow

      if(codeSet.has(code)){
        const index = items.findIndex(item=>item[codeName] == row[codeName])
        newRow = columns.map(colName=> row[colName])        
        sheet.getRange(index+2,1,1,columns.length).setValues([newRow])
      }
      else{
        row['作成日時'] = new Date()
        newRow = columns.map(colName=> row[colName])
        sheet.appendRow(newRow)
      }

      return newRow
    })

    const newItems = newRows.map(row=>columns.reduce((item,colName,idx)=>Object.assign(item,{[colName]:row[idx]}),{}))

    return formatterToJS(newItems)

  }catch(err){
    throw(sheetName,'updateRows', err)

  }finally{
    lock.releaseLock()
  }
}

function updateRows(sheetName="",rows=[]){
  // パースとスプレッドシート用にデータ変換
  try{
    rows = JSON.parse(rows)    
  }catch(e){

  }finally{
    rows = formatterToSpreadsheet(rows)
  }

  // データ取得
  lock.waitLock(10000)  
  const {sheet, values, columns, items} = getColumnsAndItemsFromSheet(sheetName)
  const idName = columns[0]  
  
  try{
    // データ書き込み
    const updatedItems = items.flatMap((item,i)=>{
      const row = rows.find(row=>row[idName]==item[idName])

      if(row){
        const newItem = Object.assign(item,row)
        const newRow = columns.map(colName=> newItem[colName] )
        sheet.getRange(i+2,1,1,columns.length).setValues([newRow])
        return [newItem]
      }else{
        return []
      }
    })

    return formatterToJS(updatedItems)

  }catch(err){
    rollback(sheet, [columns, ...values])
    throw(sheetName,'updateRows', err)
    
  }finally{
    lock.releaseLock()
  }
}

function deleteRows(sheetName="",rows=[]){
  // jsonの場合はパース
  try{
    rows = JSON.parse(rows)
  }catch{

  }

  lock.waitLock(1000) 
  const {sheet, values, columns, items} = getColumnsAndItemsFromSheet(sheetName)
  const idName = columns[0]

  try{
    // 消すアイテムが一つのときはdeleteRowを使う
    if(rows.length===1){
      const row = rows[0]
      const targetIndex = items.findIndex(item=>row[idName] == item[idName])
      if(targetIndex>0){
        sheet.deleteRow(targetIndex+2)
        const deletedItem = items[targetIndex]
        return [deletedItem]
      }else{
        return []
      }
    }
    // 複数のときは、filter処理して全て書き換える
    else{
      const targetCodeList = rows.map(row=>row[idName])
      const filteredItems = items.filter(item=>!targetCodeList.includes(item[idName]))

      const newValues = formatterToSpreadsheet(filteredItems).map(item=>columns.map(colName=>item[colName]))
      newValues.unshift(columns)
      sheet.clear()
      sheet.getRange(1,1,newValues.length,columns.length).setValues(newValues)

      const deletedItems = items.filter(item=>targetCodeList.includes(item[idName]))
      return deletedItems
    }

  }catch(err){
    rollback(sheet, [columns, ...values])
    throw(sheetName,'deleteRows', err)

  }finally{
    lock.releaseLock()
  }
}
