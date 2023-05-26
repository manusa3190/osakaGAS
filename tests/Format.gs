const Formatテスト=()=>{
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

  const getIndexesTest=()=>{
    const スプシフォーマットURL = format._ひな型をコピーしてスプシフォーマットを作成('テスト')
    const スプシフォーマットsheet = SpreadsheetApp.openByUrl(スプシフォーマットURL).getActiveSheet()
    const indexes = Format.getIndexes(スプシフォーマットsheet)
    return indexes
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

  const テーブル作成test=()=>{
    const data = {
      敷地面積:16.14,
      設立年月日:'1956/6/1',
      histories:[
        ['1504年','府中小笠原氏が築城'],
        ['1582年','木曾義昌に安堵された'],
        ['1590年','石川数正が入城'],
      ],
      events:[
        ['4/4','夜桜会','本丸庭園'],
        ['4/10','光の回廊','外堀'],
        ['5/21','松本藩古流砲術演舞','二の丸御殿'],
      ],
    }

    const スプシフォーマットURL = format._ひな型をコピーしてスプシフォーマットを作成('テスト')
    format._スプシフォーマットに行を挿入(スプシフォーマットURL,data)
    format._スプシフォーマットに値をセット(スプシフォーマットURL,data)

    const resSheet = SpreadsheetApp.openByUrl(スプシフォーマットURL).getActiveSheet()
    const resValues = resSheet.getDataRange().getValues()
    return resValues[15][2]
  }

  const pdf作成test=()=>{
    const スプシフォーマットURL = format._ひな型をコピーしてスプシフォーマットを作成('テスト')
    format._スプシフォーマットに値をセット(スプシフォーマットURL,{名前:'松本城',敷地面積:16.41,設立年月日:new Date('1594/06/01')})
    SpreadsheetApp.flush()
    
    const {pdfID} = format._スプシフォーマットからpdfを作成(スプシフォーマットURL,'テスト')
    return pdfID
  }

  try{
    test(getIndexesTest,{ events: [ 11, 0 ],histories: [ 7, 0 ],'設立年月日': [ 2, 1 ],'敷地面積': [ 1, 1 ],'名前': [ 0, 1 ] })
    test(スプシフォーマット作成test,{名前:'松本城',敷地面積:16.41,設立年月日:new Date('1594/06/01'),計算式value:16,計算式formula:'=ROUND(B2)'})
    test(テーブル作成test,'二の丸御殿')
    
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
