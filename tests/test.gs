const test=(functionName,expect)=>{
  const _ = LodashGS.load()
  const res = functionName()
  if(_.isEqual(res,expect)){
    return
  }else{
    throw `${functionName.name}でエラー`
  }
}

const testUseSample=()=>{

  const sampleTest=()=>{
    return 123
  }

  try{
    test(sampleTest,123)
  }catch(err){
    console.log(err)
  }finally{

  }
}