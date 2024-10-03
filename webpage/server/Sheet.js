// version 20241003

const トランザクションspreadsheetId = ""
const マスタspreadsheetId = ""

const lock = LockService.getScriptLock()

function getRows(sheetName="",query){
  const spreadsheetId = sheetName.includes('マスタ')? マスタspreadsheetId:トランザクションspreadsheetId 

  const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName)
  
  const values = sheet.getDataRange().getValues()

  const columns = values.shift()

  let items = values.map(row=>columns.reduce((item,colName,idx)=>Object.assign(item,{[colName]:row[idx]}),{}))

  if(query){
    const [fieldName,operator,fieldValue] = query
    switch(operator){
      case "==":{
        items=items.filter(item=>item[fieldName]==fieldValue)
        break
      }
      case "IN":{
        if(Array.isArray(fieldValue)){
          items=items.filter(item=>fieldValue.includes(item[fieldName]))
        }else{
          throw(`${tableName} getRows fieldValueが配列ではありません。fieldValue:${fieldValue}`)
        }        
        break
      }
    }
  }

  return JSON.stringify(items)
}

function addRows(sheetName="",rows=[]){
  try{
    lock.waitLock(10000)
    const spreadsheetId = sheetName.includes('マスタ')? マスタspreadsheetId:トランザクションspreadsheetId 

    const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName)

    const columns = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues().pop()

    const newRows = rows.map(row=>columns.map(colName=>{
      return colName==='Row ID'? Utilities.getUuid():row[colName]
    }))
    
    sheet.getRange(sheet.getLastRow()+1,1,rows.length,columns.length).setValues(newRows)

    const items = newRows.map(row=>columns.reduce((item,colName,idx)=>Object.assign(item,{[colName]:row[idx]}),{}))

    return {Rows:JSON.stringify(items)}    
  }catch(err){
    throw(sheetName,'updateRows', err)
  }finally{
    lock.releaseLock()
  }
}

function updateRows(sheetName="",rows=[{'Row ID':""}]){
  try{
    lock.waitLock(10000)
  
    const spreadsheetId = sheetName.includes('マスタ')? マスタspreadsheetId:トランザクションspreadsheetId 

    const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName)

    const values = sheet.getDataRange().getValues()

    const columns = values.shift()

    const items = values.map(row=>columns.reduce((item,colName,idx)=>Object.assign(item,{[colName]:row[idx]}),{}))

    const res = items.flatMap((item,i)=>{
      const row = rows.find(row=>row['Row ID']===item['Row ID'])
      if(row){
        const newItem = Object.assign(item,row)
        const newRow = columns.map(colName=>newItem[colName])
        sheet.getRange(i+2,1,1,columns.length).setValues([newRow])
        return [newItem]
      }else{
        return []
      }
    })

    return {Rows:JSON.stringify(res)}
  }catch(err){
    throw(sheetName,'updateRows', err)
  }finally{
    lock.releaseLock()
  }
}

function deleteRows(sheetName="",rows=[]){
  try{
    lock.waitLock(1000)
    const spreadsheetId = sheetName.includes('マスタ')? マスタspreadsheetId:トランザクションspreadsheetId 

    const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName)

    const rowIDs = sheet.getRange(1,1,sheet.getLastRow(),1).getValues().flatMap(cell=>cell)

    rows.forEach(row=>{
      const targetIndex = rowIDs.findIndex(rowID=>row['Row ID']===rowID)
      if(targetIndex>0){
        sheet.deleteRow(targetIndex+1)
      }
    })

    return {Rows:JSON.stringify(rows)}    
  }catch(err){
    throw(sheetName,'updateRows', err)
  }finally{
    lock.releaseLock()
  }
}
