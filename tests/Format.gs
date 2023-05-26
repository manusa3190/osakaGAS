const 指定テスト=()=>{
  const SS = SpreadsheetApp.getActiveSpreadsheet()
  const スプシ格納フォルダ = DriveApp.getFolderById('1kExRb8Hgx8iv9whSkKfLKgaugrAW5z1f')
  const pdf格納フォルダ = DriveApp.getFolderById('1t8HTAHo_Tf3aKsHP8liozR7TDhVcz1NW')

  const format = new Format({
    ひな型sheet:SS.getSheetByName('ひな型'),
    データsheet:SS.getSheetByName('シート1'),
    作成管理sheet:SS.getSheetByName('シート1'),
    スプシ格納フォルダ:スプシ格納フォルダ,
    pdf格納フォルダ:pdf格納フォルダ
  })

  const ひな型からインデックスを取り出し=()=>{
    return format._ひな型からインデックスを取り出し()
  }

  const スプシフォーマット作成test=()=>{
    const スプシフォーマットURL = format._ひな型をコピーしてスプシフォーマットを作成('テスト')
    format._スプシフォーマットに値をセット(スプシフォーマットURL,{名前:'松本城',敷地面積:16.41,設立年月日:new Date('1594/06/01')})

    const 値セット後のスプシフォーマット = SpreadsheetApp.openByUrl(スプシフォーマットURL).getActiveSheet().getDataRange()
    const values = 値セット後のスプシフォーマット.getValues()
    const formulas = 値セット後のスプシフォーマット.getFormulas()
    
    return {
      名前:values[0][1],
      敷地面積:values[1][1],
      設立年月日:values[2][1],
      計算式value:values[3][1],
      計算式formula:formulas[3][1]
    }
  }

  const pdf作成test=()=>{
    const スプシフォーマットURL = format._ひな型をコピーしてスプシフォーマットを作成('テスト')
    format._スプシフォーマットに値をセット(スプシフォーマットURL,{名前:'松本城',敷地面積:16.41,設立年月日:new Date('1594/06/01')})
    SpreadsheetApp.flush()
    
    const {pdfID} = format._スプシフォーマットからpdfを作成(スプシフォーマットURL,'テスト')
    return pdfID
  }

  try{
    test(ひな型からインデックスを取り出し,{ '名前': [ 0, 1 ], '敷地面積': [ 1, 1 ], '設立年月日': [ 2, 1 ] })
    test(スプシフォーマット作成test,{名前:'松本城',敷地面積:16.41,設立年月日:new Date('1594/06/01'),計算式value:16,計算式formula:'=ROUND(B2)'})
    
    const pdfID = pdf作成test()
    const pdfFile = pdf格納フォルダ.getFilesByName('テスト').next()
    if(pdfID!==pdfFile.getId()){
      throw 'pdf作成testでエラー'
    }
  
  }catch(err){
    console.log(err)
  }finally{
    // while(pdf格納フォルダ.getFiles().hasNext()){
    //   pdf格納フォルダ.getFiles().next().setTrashed(true)
    // }
  }
}

// CASTLE001	松本城2	{ "lat": 36.2389, "lng": 137.9685 }	16.41	1594/06/01	長野県松本市松本城3-1

const 書き込みテスト=()=>{

}
