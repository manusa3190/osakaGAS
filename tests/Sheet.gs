const シート取得テスト=()=>{
  const コンテナバインド_シート1test=()=>{
    const シート = new Sheet({})
    return シート.items[0].ID
  }
  test(コンテナバインド_シート1test,'CASTLE001')

  const コンテナバインド_シート2test=()=>{
    const シート = new Sheet({sheetName:'シート2'})
    return シート.items[0].ID
  }
  test(コンテナバインド_シート2test,'CASTLE002')

  const スタンドアローンspreadsheetID = '1BjODxZJ0eFISQKOEs6--1nDhEA_EFcnE-0fLL9rA_IE'

  const スタンドアローン_シート1test=()=>{
    const シート = new Sheet({spreadsheetId:スタンドアローンspreadsheetID})
    return シート.items[0].ID
  }
  test(スタンドアローン_シート1test,'CASTLE001')

  const スタンドアローン_シート2test=()=>{
    const シート = new Sheet({spreadsheetId:スタンドアローンspreadsheetID,sheetName:'シート2'})
    return シート.items[0].ID
  }
  test(スタンドアローン_シート2test,'CASTLE002')

  const シート = new Sheet({})

  const columnsTest=()=>{
    return シート.columns
  }
  test(columnsTest,`ID	名前	緯度経度	敷地面積	設立年月日	住所`.split('\t'))

  const docsTest=()=>{
    return シート.docs.CASTLE002.名前
  }
  test(docsTest,'姫路城')

  const key指定test=()=>{
    const シート = new Sheet({key列名:'名前'})
    return シート.docs.松本城.敷地面積
  }
  test(key指定test,16.41)
}

const シート編集テスト=()=>{
  const シート = new Sheet({})

  const setItemTest=()=>{
    const sampleRecord = シート.docs.CASTLE001
    const newRecord = {...sampleRecord,名前:'松本城2'}
    シート.setItem(newRecord)

    const newシート = new Sheet({})
    return newシート.docs.CASTLE001.名前
  }

  const dateSetTest=()=>{
    const sampleRecord = シート.docs.CASTLE001
    シート.setItem(JSON.parse(JSON.stringify(sampleRecord)))

    const newシート = new Sheet({})
    return newシート.docs.CASTLE001.設立年月日
  }

  try{
    test(setItemTest,'松本城2')
    test(dateSetTest,new Date(1594,5,1))
  }catch(err){
    console.log(err)
  }finally{
    シート.renew(シート.items)
  }
}

