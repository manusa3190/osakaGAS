// version 20240326

class Test {
  constructor(testName,sheets=[]){
    this.datas = {}
    sheets.forEach(sheet=>{ //このsheetは自作Sheetクラスのインスタンス
      const spreadsheetId = sheet.spreadsheet.getId()
      const sheetName = sheet.sheet.getName()
      if(!this.datas[spreadsheetId])this.datas[spreadsheetId] = {}
      this.datas[spreadsheetId][sheetName] = [sheet.columns,...sheet.values]
    })

    this.testName = testName
    this.tests = []
  }

  setTest(description=String(), callback=Function(), option={reset:false,showResult:true}){
    this.tests.push({description,callback,option})
  }

  reset(){
    Object.entries(this.datas).forEach(([spreadsheetId,sheetDatas])=>{
      const spreadsheet = SpreadsheetApp.openById(spreadsheetId)
      Object.entries(sheetDatas).forEach(([sheetName,values])=>{
        const sheet = spreadsheet.getSheetByName(sheetName)
        if(!sheet)throw(`${sheetName}が見つかりません`)
        sheet.clear() 
        sheet.getRange(1,1,values.length,values[0].length).setValues(values)
      })
    })
  }

  _getType(arg){
    const toString = Object.prototype.toString;
    return toString.call(arg).replace('[object ','').replace(']','')
  }

  run({only=[],exclude=[]}){
    if(only.length){
      this.tests = this.tests.filter(({description})=>only.includes(description))
    }
    if(exclude.length){
      this.tests = this.tests.filter(({description})=>!exclude.includes(description))
    }

    const self = this // function isEqualで使用するため

    function isEqual(val1,val2){
      const val1Type = self._getType(val1)
      const val2Type = self._getType(val2)
      if(val1Type!==val2Type)return false

      switch(val1Type){
        case 'Array':
          return val1.every(v1=>val2.includes(v1)) && val2.every(v2=>val1.includes(v2))
        case 'String':
        case 'Number':
          return val1===val2
        case 'Null':
          return val2===null
        case 'Date':
          return val1.getTime() === val2.getTime()
        case 'Object':
          return Object.keys(val1).every(key=>isEqual(val1[key],val2[key]))
      }
    }

    this.tests.forEach(({description,callback,option})=>{
      let {expect,result} = callback()
      const {reset,showResult} = option
      if(isEqual(expect,result)){
        console.log(description,'OK')
      }else{
        console.log(description,'NG')
        if(showResult){
          if(this._getType(expect))expect=JSON.stringify(expect)
          if(this._getType(result))result=JSON.stringify(result)
          console.log(`  expect:${expect}`)
          console.log(`  result:${result}`)
        }
      }

      if(reset)this.reset()
    })
  }
}
