    const getRows = async(tableName,query) => new Promise(async(resolve,reject)=>{
      google.script.run
        .withSuccessHandler(res=>{
          res = JSON.parse(res)
          const docs = res.reduce((acc,item)=>Object.assign(acc,{[item['Row ID']]:item}),{})
          resolve(docs)
        })
        .withFailureHandler(err=>{
          console.log(tableName,'Error:',err)
          reject(err)
        })
        .getRows(tableName,query)      
    })

    const addRows = async(tableName,rows) => new Promise(async(resolve,reject)=>{
      google.script.run
        .withSuccessHandler(res=>{
          const items = JSON.parse(res['Rows'])
          const docs = items.reduce((acc,item)=>Object.assign(acc,{[item['Row ID']]:item}),{})
          resolve(docs)
        })
        .withFailureHandler(err=>{
          console.log(tableName,'Error:',err)
          reject(err)
        })
        .addRows(tableName,rows)
    })

    const updateRows = async(tableName,rows) => new Promise(async(resolve,reject)=>{
      google.script.run
        .withSuccessHandler(res=>{
          const items = JSON.parse(res['Rows'])
          const docs = items.reduce((acc,item)=>Object.assign(acc,{[item['Row ID']]:item}),{})
          resolve(docs)
        })
        .withFailureHandler(err=>{
          console.log(tableName,'Error:',err)
          reject(err)
        })
        .updateRows(tableName,rows)      
    })

    const deleteRows = async(tableName,rows) => new Promise(async(resolve,reject)=>{
      google.script.run
        .withSuccessHandler(res=>{
          const items = JSON.parse(res['Rows'])
          const docs = items.reduce((acc,item)=>Object.assign(acc,{[item['Row ID']]:item}),{})
          resolve(docs)
        })
        .withFailureHandler(err=>{
          console.log(tableName,'Error:',err)
          reject(err)
        })
        .deleteRows(tableName,rows)      
    })

    const setRows = async(tableName,rows) => new Promise(async(resolve,reject)=>{
      const newRows = []
      const editRows = []
      const removeRows = []

      rows.forEach(row=>{
        if(row['Row ID']==='new' && !row['setTrushed']){
          newRows.push(row)
        }else if(row['Row ID']!=='new' && row['setTrushed']){
          removeRows.push(row)
        }else{
          editRows.push(row)
        }
      })

      const [a,u,_] = await Promise.all([
        addRows(tableName,newRows),
        updateRows(tableName,editRows),
        deleteRows(tableName,removeRows)
      ])

      return Object.assign(a,u)
    })
